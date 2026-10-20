// Design tokens — "In-App Purchases" palette: a warm hide-beige → soft mint gradient canvas
// with white rows/inputs, white/near-white "feature" cards (KPIs, chart, gauge), a deep sage
// ("forest") for interactive/active state and a mint → forest gradient for data.
// Source swatches (kept verbatim where they work as surfaces/backgrounds):
//   Lynx White #F9F7F6 · Toxic Essence #CEE9BD · Light Weathered Hide #E0D5CF ·
//   Arbor Vitae #BCC5AD · Chicago #5C5E58 · Black Metal #050504.
// Arbor Vitae/Toxic Essence are too pale to read as text or icons on a white card, so `accent`
// and `accentStrong` are a darkened, same-hue "forest" derived from Arbor Vitae — used only
// where the palette itself needs a legible accent (icons, links, active states); the pale
// swatches stay as fills/washes, exactly as they read in the source palette.
// Primitives referenced from more than one place below, so an edit to the hex only ever
// happens in one spot — `success`/`danger`/`warning` text variants and `info` are aliases of
// these, not independent literals that could quietly drift apart from them.
const GREEN = '#1ED58A';
const GREEN_STRONG = '#0A7A4C'; // darkened for text/icons — ~1.9:1 on white as the bright base, 5.4:1 darkened
const DANGER_STRONG = '#A82A22'; // darkened `danger` for text/icons — 6.9:1 on white vs. 3.6:1 for the bright base
const WARNING_STRONG = '#9C4D00'; // darkened `warning` for text/icons — 6.0:1 on white vs. 1.8:1 for the bright base
// Primary-action fill ("Save item", "Create order", "Save bill", etc. — every PrimaryButton
// `variant="light"`): a neutral warm grey, matching the bottom bar/dock surface, not the
// forest/sage `accent` the rest of the UI (icons, active states, chips) uses. CTA_STRONG is
// its pressed shade.
const CTA = '#8A807F';
const CTA_STRONG = '#6B6362';

export const colors = {
  // Light canvas — a single warm-linen hue, just barely deepening from top to bottom (no hue
  // shift into a cooler tone) so long sessions of stock/sales work read as calm and settled
  // rather than a visible decorative gradient.
  bg: '#F3EFE9', // midpoint of bgGradient: solid fallback behind the gradient / scene flashes
  bgGradient: ['#F8F4EE', '#EEE8DF'], // warm linen, drawn top → bottom
  elevated: '#FFFFFF',
  elevated2: '#F9F7F6', // Lynx White
  elevated3: '#DDE3D3', // lightened Arbor Vitae
  line: '#E0D5CF', // Light Weathered Hide

  // Text on the light canvas
  text: '#050504', // Black Metal
  textMuted: '#5C5E58', // Chicago
  textFaint: '#8B8D84', // lightened Chicago

  // Light cards ("ink" is text on a card)
  card: '#FFFFFF',
  cardAlt: '#F9F7F6', // Lynx White
  cardFade: '#F7F5F1',
  ink: '#050504', // Black Metal
  inkMuted: '#5C5E58', // Chicago
  inkLine: '#E6E2D9',

  // Chips / badges / avatars nested inside an already-white row
  chip: '#E3E7DA', // lightened Arbor Vitae

  // True white paper — only where contrast must be dark-on-white (QR codes)
  paper: '#FFFFFF',
  paperInk: '#0A0A0A',

  // Accents
  accent: '#59664C', // Arbor Vitae, darkened to a legible "forest" sage
  onAccent: '#F9F7F6', // Lynx White text/icons on the forest fill
  accentStrong: '#3D4634', // deeper forest, for text/outlines needing extra contrast
  // (There is no separate `info` token: "info" states use `accent` directly — a distinct
  // hex for the same brand color would just be a second name that can silently drift.)

  // Primary-action fill — see CTA/CTA_STRONG above. `onCta` is the text/icon color on it.
  // Requested as pure white for "Create order" and the other `variant="light"` PrimaryButtons;
  // note this clears only ~3.5:1 against the CTA mid-grey fill, under the 4.5:1 AA floor the
  // previous dark `onCta` was chosen to meet.
  cta: CTA,
  ctaStrong: CTA_STRONG,
  onCta: '#FFFFFF',

  // `green` is the one brand-green hex, used both as a decorative data-viz swatch (charts,
  // gradients) and — aliased as `success` — as the "good" status color; both names point at
  // the same constant above so they can't desync. Fills (chart lines, toast icon backgrounds,
  // status dots/pills) can use the bright base color directly; on the light canvas it's too
  // pale to pass as TEXT or an icon glyph (~1.9:1 on white, well under the 4.5:1 AA floor), so
  // `greenStrong`/`successStrong` are the darkened variant for that use — same rule
  // `accentStrong` follows for `accent`.
  green: GREEN,
  greenStrong: GREEN_STRONG,

  // Status. `danger`/`warning` are bright fills only — ~3.6:1 and ~1.8:1 on white, both under
  // the 4.5:1 AA floor for text — so `dangerStrong`/`warningStrong` are the text/icon-safe
  // darkened variants (same pattern as `greenStrong`, all ≥4.5:1 on white). `success` is
  // `green` under a semantic name; `info` isn't a separate token, see `accent` above.
  danger: '#F2484E',
  dangerStrong: DANGER_STRONG,
  success: GREEN,
  successStrong: GREEN_STRONG,
  warning: '#FFB020',
  warningStrong: WARNING_STRONG,

  gradient: [GREEN, '#9BBF7A', '#59664C'],

  // Shared surface for the floating navigation and compact actions — a neutral warm grey
  // (not the forest `accent` family) so the bottom dock reads as its own chrome rather than a
  // darker shade of the same green used for active states elsewhere.
  bar: '#8A807F',
  barSoft: '#A89E9D',
  // Inactive tab-bar glyph: `bar` lightened from near-black charcoal to a mid-grey means plain
  // white no longer clears 4.5:1 against it (~2:1) — this dark neutral does (~4.7:1).
  onBar: '#2A2724',

  // Web presentation stage behind the phone frame
  stage: '#2A2A30',

  // Shared shadow color — every `shadowColor` in the app should point here instead of
  // re-typing '#000', so a future theme change (e.g. a tinted shadow) is a one-line edit.
  shadow: '#000000',
};

// Categorical data-viz swatches — for charts/legends that need more than the two or three
// semantic status colors (e.g. the dashboard's per-category health bars). `sage`/`mint`/`coral`
// reuse the semantic tokens above so a legend swatch and a status color never silently diverge;
// `mustard`/`violet`/`slate` exist only here.
export const chartPalette = {
  sage: colors.accent,
  mint: colors.green,
  mustard: '#F2B33D',
  coral: colors.danger,
  violet: '#8B7CF6',
  slate: '#9A9AA5',
};

// Tones for the login/signup shelf illustration (screens/auth/ShelfScene.js) only — kept out
// of `colors` because they're scene-specific (produce crates, wood, milk glass), not reusable
// UI tokens. Reuses the shared red/green/mustard above so the illustration and the in-app
// data-viz can't drift apart; `milk`/`plank`/`edge`/`shade` are illustration-only.
export const illustration = {
  tomato: colors.danger,
  mustard: chartPalette.mustard,
  leaf: colors.green,
  milk: '#F4F6F8',
  plank: '#3C3C45',
  edge: '#4A4A54',
  shade: '#1E1E23',
};

// The soft glow behind the top of every screen (components/PatternBackground.js), one tint per
// tab so each section is recognisable at a glance while sharing the exact same treatment. Each
// is a three-stop pastel gradient — every stop stays light so the canvas never darkens behind
// cards or text, only the hue changes from section to section.
export const sectionTints = {
  Dashboard: ['#BFF0D6', '#DDEFC9', '#C9DDB8'], // pale mint → sage
  Stock: ['#BDEFE4', '#D6F2EC', '#B7DDD8'], // pale aqua
  Purchase: ['#FBE3B0', '#FCEFD2', '#F3D9A8'], // pale wheat
  Sale: ['#FBD3C6', '#FDE6DD', '#F4C8BA'], // pale peach
  More: ['#DCD6FA', '#ECE8FD', '#D2CCF2'], // pale lavender
};

// Data tones: [start, end] of a waveform / gauge gradient, keyed by metric tone. `violet`,
// `mustard` and `slate` are darkened companions of the matching `chartPalette` swatch (same hue,
// a deeper shade for the gradient's far end) so a metric card's waveform and the category
// donut/bars read as the same palette instead of two unrelated colour sets.
export const tones = {
  green: [GREEN, '#9BBF7A'],
  cyan: ['#9BBF7A', '#59664C'],
  red: ['#F2484E', '#FF7A59'],
  violet: ['#8B7CF6', '#5C4ACB'],
  mustard: ['#F2B33D', '#C4891E'],
  slate: ['#9A9AA5', '#6E6E78'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

// Centralized elevation presets — every card/button/sheet shadow in the app should spread one
// of these instead of re-typing its own shadowOpacity/shadowRadius/shadowOffset/elevation, so a
// future "make everything cast a bit more shadow" edit is three lines, not forty. All three key
// off the shared `colors.shadow` token (never a literal '#000'); `sm` suits a resting list
// row/tile, `md` a standalone card or floating button, `lg` a sheet/dialog/toast that should
// read as sitting well above the canvas.
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

// Manrope carries the whole app: heavier weights (700/800) for headlines and big figures,
// lighter ones (400-600) for running text, labels, buttons and inputs. It is also the default
// for any <Text>/<TextInput> that sets no fontFamily of its own (see App.js). Its even,
// modern numerals keep prices, totals and quantities aligned and legible at small sizes.
export const fonts = {
  display: 'Manrope_800ExtraBold',
  displayBold: 'Manrope_700Bold',
  displaySemiBold: 'Manrope_600SemiBold',
  displayMedium: 'Manrope_500Medium',
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
};

// Mobile hierarchy: main headers 24-28 (Manrope Bold/ExtraBold), section headers 18-20
// (Manrope SemiBold), body/inputs 15-16 (Manrope Regular), captions/micro-copy/graph labels 12-13
// (Manrope Medium/Regular).
export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontFamily: fonts.display, letterSpacing: -1.2 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: fonts.display, letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 28, fontFamily: fonts.displaySemiBold, letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 24, fontFamily: fonts.displayMedium, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fonts.body },
  small: { fontSize: 13, lineHeight: 17, fontFamily: fonts.body },
  label: { fontSize: 12, fontFamily: fonts.bodyMedium, letterSpacing: 0.4 },
  button: { fontSize: 16, fontFamily: fonts.bodyBold, letterSpacing: -0.2 },
};

export default { colors, chartPalette, illustration, sectionTints, tones, spacing, radius, shadows, typography, fonts };
