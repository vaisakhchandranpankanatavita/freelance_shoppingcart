import math, subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1920, 1080, 30
FR = 'fr/%05d.jpg'
FONT = '../../node_modules/@expo-google-fonts/bricolage-grotesque'
def font(w, size):
    d = {800: '800ExtraBold', 700: '700Bold', 600: '600SemiBold', 500: '500Medium'}[w]
    return ImageFont.truetype(f'{FONT}/{d}/BricolageGrotesque_{d}.ttf', size)

CHAR, CYAN, GREEN, CREAM = (42, 42, 48), (30, 183, 235), (30, 213, 138), (255, 246, 233)

# (out_start, out_dur, src_start, src_end)
SEGS = [
    (0.0, 3.6, 1.2, 6.4),      # splash -> sign in
    (3.6, 2.3, 6.9, 9.0),      # PIN
    (5.9, 2.2, 9.0, 13.0),     # loader
    (8.1, 3.8, 13.0, 17.6),    # dashboard
    (11.9, 3.0, 19.0, 24.4),   # picker
    (14.9, 2.6, 26.0, 33.4),   # bill
    (17.5, 1.6, 33.4, 36.6),   # bill summary
]
TOTAL = 21.7
OUTRO = 19.1

def src_time(t):
    for o, d, a, b in SEGS:
        if o <= t < o + d:
            return a + (t - o) / d * (b - a)
    return SEGS[-1][3]

def out_time(src):
    for o, d, a, b in SEGS:
        if a <= src <= b:
            return o + (src - a) / (b - a) * d
    return None

# (kicker, text, start, end)
CAPS = [
    ('', "The supermarket admin app for billing staff.", 0.3, 3.5),
    ('SIGN IN', "Sign in with a 4-digit PIN.", 3.7, 6.6),
    ('DASHBOARD', "Stock value and restock alerts, live from your store.", 8.2, 11.8),
    ('QUICK ACTIONS', "Jump to any job with a swipe.", 12.0, 14.85),
    ('NEW BILL', "Cart to checkout in one flow.", 15.0, 19.0),
]

# ---------- static art ----------
def background():
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    base = np.zeros((H, W, 3), np.float32) + np.array(CHAR, np.float32)
    def glow(cx, cy, r, col, a):
        d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / r
        m = np.clip(1 - d, 0, 1) ** 2 * a
        return m[..., None] * (np.array(col, np.float32) - base)
    base += glow(1500, 120, 900, CYAN, 0.30) + glow(200, 1000, 800, GREEN, 0.20)
    return Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
BG = background()

SW, SH = 434, 939
PAD = 15
PX, PY = 1400 - SW // 2, (H - SH) // 2
def phone_layers():
    ow, oh = SW + PAD * 2, SH + PAD * 2
    shadow = Image.new('RGBA', (ow + 200, oh + 200), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((100, 130, 100 + ow, 130 + oh), 66, fill=(0, 0, 0, 170))
    shadow = shadow.filter(ImageFilter.GaussianBlur(38))
    bezel = Image.new('RGBA', (ow, oh), (0, 0, 0, 0))
    d = ImageDraw.Draw(bezel)
    d.rounded_rectangle((0, 0, ow - 1, oh - 1), 60, fill=(14, 14, 18, 255), outline=(70, 70, 80, 255), width=2)
    hole = Image.new('L', (ow, oh), 0)
    ImageDraw.Draw(hole).rounded_rectangle((PAD, PAD, PAD + SW, PAD + SH), 45, fill=255)
    a = np.array(bezel)
    a[..., 3] = np.where(np.array(hole) > 0, 0, a[..., 3])
    bezel = Image.fromarray(a)
    mask = Image.new('L', (SW, SH), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SW - 1, SH - 1), 45, fill=255)
    return shadow, bezel, mask
SHADOW, BEZEL, MASK = phone_layers()

def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3

def wrap(text, f, maxw):
    words, lines, cur = text.split(), [], ''
    dr = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if dr.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w_
    lines.append(cur); return lines

CAP_CACHE = {}
def caption_img(i):
    if i in CAP_CACHE: return CAP_CACHE[i]
    kick, text, _, _ = CAPS[i]
    f, fk = font(800, 96), font(700, 30)
    lines = wrap(text, f, 900)
    lh = 108
    img = Image.new('RGBA', (960, 120 + lh * len(lines)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    y = 0
    if kick:
        x = 0
        d.rounded_rectangle((0, 12, 44, 18), 3, fill=CYAN + (255,))
        for ch in kick:
            d.text((62 + x, 0), ch, font=fk, fill=CYAN + (255,)); x += d.textlength(ch, font=fk) + 4
    y = 66
    for ln in lines:
        d.text((0, y), ln, font=f, fill=(255, 255, 255, 255)); y += lh
    CAP_CACHE[i] = img; return img

def paste_alpha(base, layer, xy, alpha):
    if alpha <= 0: return
    if alpha < 1:
        l = layer.copy(); a = l.getchannel('A').point(lambda v: int(v * alpha)); l.putalpha(a)
    else: l = layer
    base.paste(l, xy, l)

def outro_layer():
    img = Image.new('RGBA', (1400, 420), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    f = font(800, 250); d.text((0, 0), 'grocery', font=f, fill=(255, 255, 255, 255))
    f2 = font(700, 52); x = 6
    for i, (word, col) in enumerate([('Stock', GREEN), ('Purchase', CYAN), ('Sale', CREAM)]):
        d.text((x, 300), word, font=f2, fill=col + (255,)); x += d.textlength(word, font=f2) + 30
        if i < 2: d.ellipse((x - 20, 330, x - 12, 338), fill=(154, 154, 165, 255))
    return img
OUTRO_IMG = outro_layer()

def frame(t):
    im = BG.copy()
    # phone
    ph_in = ease(t / 0.7)
    ph_out = 1 - ease((t - OUTRO) / 0.28)
    ph = min(ph_in, ph_out)
    if ph > 0:
        dy = int((1 - ph) * 40)
        paste_alpha(im, SHADOW, (PX - PAD - 100, PY - PAD - 100 + dy), ph)
        s = Image.open(FR % max(1, min(1100, int(round(src_time(t) * FPS)) + 1))).convert('RGB')
        scr = Image.new('RGBA', (SW, SH)); scr.paste(s, (0, 0)); scr.putalpha(MASK)
        paste_alpha(im, scr, (PX, PY + dy), ph)
        paste_alpha(im, BEZEL, (PX - PAD, PY - PAD + dy), ph)
    # captions
    for i, (_, _, a, b) in enumerate(CAPS):
        if a <= t <= b:
            al = min(ease((t - a) / 0.4), 1 - ease((t - (b - 0.25)) / 0.25))
            img = caption_img(i)
            yy = (H - img.height) // 2 + int((1 - ease((t - a) / 0.4)) * 26)
            paste_alpha(im, img, (130, yy), al)
    # outro
    if t >= OUTRO + 0.25:
        al = ease((t - OUTRO - 0.25) / 0.5)
        paste_alpha(im, OUTRO_IMG, (130 + int((1 - al) * -24), (H - 420) // 2 - 20), al)
    return im

# ---------- audio ----------
SR = 44100
N = int(TOTAL * SR)
def synth():
    rng = np.random.default_rng(7)
    t = np.arange(N) / SR
    mus = np.zeros(N, np.float32); sfx = np.zeros(N, np.float32)
    def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
    bpm = 100; beat = 60 / bpm; bar = beat * 4
    chords = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]  # Am F C G
    def add(buf, start, sig, gain=1.0):
        i = int(start * SR)
        if i >= N: return
        j = min(N, i + len(sig)); buf[i:j] += sig[:j - i] * gain
    def env(n, a, r):
        e = np.ones(n, np.float32); na = max(1, int(a * SR)); nr = max(1, int(r * SR))
        e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr)); return e
    def tone(freq, dur, kind='sine', a=0.005, r=0.2):
        n = int(dur * SR); tt = np.arange(n) / SR
        if kind == 'sine': s = np.sin(2 * np.pi * freq * tt)
        elif kind == 'pluck': s = (np.sin(2 * np.pi * freq * tt) + 0.35 * np.sin(4 * np.pi * freq * tt) * np.exp(-tt * 8)) * np.exp(-tt * 6)
        elif kind == 'pad': s = sum(np.sin(2 * np.pi * freq * (1 + d) * tt) for d in (-0.004, 0, 0.004)) / 3
        else: s = np.sin(2 * np.pi * freq * tt)
        return (s * env(n, a, r)).astype(np.float32)
    nbars = int(math.ceil(TOTAL / bar))
    for b in range(nbars):
        root, tri = chords[b % 4]; t0 = b * bar
        for m in tri: add(mus, t0, tone(hz(m), bar + 0.25, 'pad', 0.5, 0.6), 0.055)
        add(mus, t0, tone(hz(root), bar, 'sine', 0.02, 0.3), 0.16)
        for k in range(8):   # plucky arpeggio, eighths
            m = tri[[0, 1, 2, 1, 0, 1, 2, 2][k]] + 12
            add(mus, t0 + k * beat / 2, tone(hz(m), 0.5, 'pluck'), 0.085)
        for k in range(4):   # soft kick on the beat
            n = int(0.25 * SR); tt = np.arange(n) / SR
            f = 45 + 90 * np.exp(-tt * 28); kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 12)
            add(mus, t0 + k * beat, kick.astype(np.float32), 0.20 if b >= 1 else 0.0)
        for k in range(8):   # quiet hat
            n = int(0.04 * SR); h = rng.standard_normal(n).astype(np.float32) * np.exp(-np.arange(n) / SR * 120)
            h = np.diff(h, prepend=0)
            add(mus, t0 + k * beat / 2 + beat / 4 * (k % 2), h, 0.05 if b >= 1 else 0)
    # sfx ---------------------------------------------------------------------
    def blip(t0, m, g=0.10):
        add(sfx, t0, tone(hz(m), 0.16, 'sine', 0.002, 0.14) * np.exp(-np.arange(int(0.16 * SR)) / SR * 14), g)
    def whoosh(t0, dur=0.55, g=0.05, up=True):
        n = int(dur * SR); x = rng.standard_normal(n).astype(np.float32)
        # simple moving low-pass with sweeping cutoff
        y = np.zeros(n, np.float32); acc = 0.0
        for i in range(n):
            c = (i / n) if up else (1 - i / n)
            a = 0.02 + 0.25 * c * c
            acc += a * (x[i] - acc); y[i] = acc
        e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5
        add(sfx, t0, y * e, g * 6)
    def chime(t0, notes=(72, 76, 79, 84), g=0.08):
        for i, m in enumerate(notes):
            add(sfx, t0 + i * 0.07, tone(hz(m), 0.9, 'sine', 0.003, 0.85) * np.exp(-np.arange(int(0.9 * SR)) / SR * 4), g)
    def tick(t0, m=81, g=0.07):
        n = int(0.05 * SR); add(sfx, t0, (np.sin(2 * np.pi * hz(m) * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 90)).astype(np.float32), g)
    def at(src): return out_time(src)
    whoosh(0.05, 0.5, 0.05)                       # open
    for k, m in enumerate([69, 72, 76, 81]):      # PIN digits: A C E A
        o = at(7.18 + 0.38 * k + 0.02)
        if o: blip(o, m, 0.10)
    whoosh(5.85, 0.7, 0.06)                       # loader lift-off
    chime(8.05, (76, 79, 83), 0.06)               # dashboard lands
    for s in (19.0, 20.35, 21.7, 22.75):          # picker ticks
        o = at(s)
        if o:
            for q in range(4): tick(o + q * 0.045, 81 + q, 0.05)
    o = at(25.0)
    if o: blip(o, 76, 0.09)                       # tap: New bill
    for s in (29.95, 30.75):                      # add items
        o = at(s)
        if o: blip(o, 79, 0.08)
    o = at(33.55)
    if o: blip(o, 72, 0.09)                       # generate bill
    o = at(34.1)
    chime(o if o else 18.0, (72, 76, 79, 84), 0.09)   # checkout ready
    whoosh(OUTRO - 0.1, 0.5, 0.05, up=False)
    chime(OUTRO + 0.3, (69, 72, 76, 81), 0.09)   # outro
    # sidechain-ish: duck music slightly under sfx; overall fades
    duck = 1 - 0.25 * np.clip(np.abs(sfx) * 8, 0, 1)
    fade = np.minimum(1, t / 0.15) * np.minimum(1, (TOTAL - t) / 1.0)
    mix = (mus * duck * 0.85 + sfx) * fade
    # gentle soft-clip / limiter
    mix = np.tanh(mix * 1.6) / 1.6
    peak = np.max(np.abs(mix)); mix = mix / peak * 0.85
    return mix.astype(np.float32)

def main():
    import wave
    a = synth()
    with wave.open('audio.wav', 'wb') as w_:
        w_.setnchannels(1); w_.setsampwidth(2); w_.setframerate(SR)
        w_.writeframes((a * 32767).astype('<i2').tobytes())
    if len(sys.argv) > 1 and sys.argv[1] == 'stills':
        for t in [0.2, 1.5, 3.4, 4.6, 5.9, 6.4, 7.0, 8.3, 10.0, 11.9, 12.6, 13.9, 15.5, 17.0, 18.6, 19.3, 19.6, 20.4, 21.6]:
            frame(t).save(f'still_{t:05.2f}.png')
        return
    POSTER = 10.0
    frame(POSTER).convert('RGB').save('../brag.jpg', quality=95)
    poster = frame(POSTER).convert('RGB')
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-i', 'audio.wav', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                          '-shortest', '-movflags', '+faststart', '../brag.mp4'], stdin=subprocess.PIPE)
    n = int(round(TOTAL * FPS))
    for i in range(n):
        im = poster if i == 0 else frame(i / FPS).convert('RGB')   # frame 0 = the poster
        p.stdin.write(im.tobytes())
    p.stdin.close(); p.wait()
main()
