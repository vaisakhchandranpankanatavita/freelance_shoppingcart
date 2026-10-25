# Shared UI components (React Native / Expo, StyleSheet — no Tailwind)

## `src/components/MetricCard.js`
```js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import Waveform from './Waveform';
import { colors, fonts, radius, spacing, tones } from '../theme';

// One card of the dashboard carousel. As it scrolls off to the left it shrinks
// and dims (driven by the carousel's UI-thread scroll offset).
export default function MetricCard({ metric, index, scrollX, interval, width, onPress }) {
  const [from, to] = tones[metric.tone];

  const style = useAnimatedStyle(() => {
    const pos = index * interval;
    // Full size while in view or to the right; shrinks/dims once scrolled past.
    const range = [pos, pos + interval];
    return {
      opacity: interpolate(scrollX.value, range, [1, 0.25], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.value, range, [1, 0.86], Extrapolation.CLAMP) },
        { translateX: interpolate(scrollX.value, range, [0, interval * 0.18], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, style]}>
      <PressableScale
        style={styles.card}
        onPress={onPress}
        accessibilityLabel={`${metric.title}: ${metric.value} ${metric.unit}. Open details`}
      >
        <View style={styles.top}>
          <Text style={styles.value}>
            {metric.value.toLocaleString('en-IN')} <Text style={styles.unit}>{metric.unit}</Text>
          </Text>
          <View style={[styles.badge, { borderColor: to }]}>
            {metric.badge ? (
              <Text style={[styles.badgeText, { color: to }]}>{metric.badge}</Text>
            ) : (
              <Icon name={metric.icon} size={15} color={to} />
            )}
          </View>
        </View>
        <Waveform from={from} to={to} seed={index + 1} height={30} style={styles.wave} />
        <Text style={styles.title} numberOfLines={1}>
          {metric.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {metric.subtitle}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: colors.ink, fontSize: 13, fontFamily: fonts.bodyBold },
  unit: { color: colors.accent, fontSize: 9, fontFamily: fonts.bodyBold, letterSpacing: 0.6 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bodyBold },
  wave: { marginTop: spacing.xs, marginBottom: spacing.sm, marginHorizontal: spacing.xs },
  title: { color: colors.ink, fontSize: 15, fontFamily: fonts.bodyBold, letterSpacing: -0.3 },
  subtitle: { color: colors.inkMuted, fontSize: 11, marginTop: spacing.xs / 2 },
});
```

## `src/components/Glass.js`
```js
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import GlassBlur from './GlassBlur';
import { colors, radius, shadows } from '../theme';

// Neutral frosted canvas for glass cards: soft white and grey light shapes under a heavy blur,
// no colour. The variation behind the blur is what lets the cards read as glass.
// Absolute-fills its parent and ignores touches.
export function GlassBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, { top: '-6%', right: '-22%', width: 300, height: 300, backgroundColor: '#FFFFFF', opacity: 0.9 }]} />
      <View style={[styles.blob, { top: '30%', left: '-30%', width: 280, height: 280, backgroundColor: '#AEB8BD', opacity: 0.5 }]} />
      <View style={[styles.blob, { bottom: '4%', right: '-18%', width: 260, height: 260, backgroundColor: '#9AA6AC', opacity: 0.4 }]} />
      <View style={[styles.blob, { bottom: '-8%', left: '-10%', width: 200, height: 200, backgroundColor: '#FFFFFF', opacity: 0.8 }]} />
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.35)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// Frosted fade over the bottom edge of a scrolling screen: content thins out into neutral frost
// with no visible edge. Web masks the blur itself to a gradient; native (BlurView can't be
// masked) relies on the gradient alone. Ignores touches.
const WEB_MASK = Platform.select({
  web: {
    maskImage: 'linear-gradient(to bottom, transparent, #000 75%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 75%)',
  },
  default: null,
});

export function GlassEdge({ height = 110 }) {
  return (
    <View style={[styles.edge, { height }]} pointerEvents="none">
      {WEB_MASK ? <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, WEB_MASK]} /> : null}
      <LinearGradient
        colors={['rgba(238,238,234,0)', 'rgba(238,238,234,0.6)', 'rgba(238,238,234,0.92)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const MARGIN_KEYS = ['margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical'];

// Frosted-glass surface: translucent white, its own backdrop blur and a bright hairline edge.
// Shadow lives on an outer wrapper and clipping (for the blur + rounded corners) on the inner
// one — the two can't share a view, because `overflow: 'hidden'` clips Android's `elevation`
// shadow down to a hard, visible line instead of a soft spread (same issue SectionCard avoids).
export function GlassCard({ children, style, intensity = 40 }) {
  const flat = StyleSheet.flatten(style) || {};
  const borderRadius = flat.borderRadius ?? radius.lg;
  const outer = { borderRadius };
  const inner = { borderRadius };
  Object.entries(flat).forEach(([k, v]) => {
    if (MARGIN_KEYS.includes(k)) outer[k] = v;
    else if (k !== 'borderRadius') inner[k] = v;
  });
  return (
    <View style={[styles.shadowWrap, outer]}>
      <View style={[styles.card, inner]}>
        <GlassBlur intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.55 },
  // `backgroundColor` here isn't visual (the inner card paints over it) — Android's `elevation`
  // on a transparent view falls back to painting a solid grey box instead of a soft shadow, so
  // every shadow wrapper needs an opaque background matching the canvas behind it.
  shadowWrap: { backgroundColor: colors.bg, ...shadows.sm },
  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});
```

## `src/components/GlassBlur.js`
```js
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

// expo-blur has no real Gaussian blur on Android before RenderEffect (API 31) and even where it
// is available it composites unreliably here: stacked bands meant to taper a blur/tint wash out
// toward flat white regardless of the `tint` colour, and can ignore an ancestor's
// `overflow: hidden` clip, bleeding square past rounded corners. iOS's blur is the real thing and
// composites exactly where it's drawn, so every "frosted glass" surface in the app renders real
// blur there but renders *nothing* here and leans entirely on its own solid/gradient backdrop —
// one working look per platform instead of one broken-on-Android look everywhere.
// `web` behaves like iOS (CSS backdrop-filter) in practice, so it keeps the blur too.
export default function GlassBlur(props) {
  if (Platform.OS === 'android') return null;
  return <BlurView {...props} />;
}
```

## `src/components/StackedList.js`
```js
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GlassBlur from './GlassBlur';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radius, shadows, spacing } from '../theme';

const ROW_H = 58;
const GAP = 8;
// Small round expand toggle, overlapping the first row's bottom-right corner instead of a
// full-width strip — collapsed state now shows exactly one item, nothing peeking/blurred below.
const TOGGLE_SIZE = 28;
const ease = { duration: 420, easing: Easing.inOut(Easing.cubic) };

function Card({ children }) {
  // Shadow on this wrapper, clipping (blur + rounded corners) on the inner view —
  // `overflow: 'hidden'` next to Android's `elevation` shadow clips it into a hard line.
  // GlassBlur is a no-op on Android (see that file) — the card's own translucent white
  // `backgroundColor` (styles.card) is what actually reads as "glass" there.
  return (
    <View style={styles.shadowWrap}>
      <View style={styles.card}>
        <GlassBlur intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    </View>
  );
}

// A plain vertical list of frosted-glass rows. Collapsed shows only the first row; "Show all"
// expands the rest in place (a simple height reveal, no card-deck illusion). `renderItem(item)`
// fills one row.
export default function StackedList({ items, keyExtractor, renderItem, label }) {
  const [open, setOpen] = useState(false);
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(open ? 1 : 0, ease);
  }, [open]);

  const n = items.length;
  // Collapsed shows exactly the first row, nothing else — no peeking/blurred sliver of the next
  // item. Expanded adds every remaining row at full height.
  const collapsedH = ROW_H;
  const expandedH = n * ROW_H + (n - 1) * GAP;
  const boxStyle = useAnimatedStyle(() => ({
    height: interpolate(p.value, [0, 1], [collapsedH, expandedH]),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.box, boxStyle]}>
        {items.map((item, i) => (
          <View key={keyExtractor(item)} style={[styles.row, i > 0 && { marginTop: GAP }]}>
            <Card>{renderItem(item)}</Card>
          </View>
        ))}
      </Animated.View>

      {n > 1 ? (
        <PressableScale
          onPress={() => setOpen((o) => !o)}
          scaleTo={0.9}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={open ? `Show fewer ${label}` : `Show all ${n} ${label}`}
        >
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // marginBottom reserves the space the toggle pokes into (it's absolutely positioned at
  // `bottom: -TOGGLE_SIZE / 2`, outside this wrap's own laid-out height) — without it, the next
  // sibling below (e.g. a section heading with only a few px of margin-top) starts right under
  // the toggle and visually/touch-wise sits on top of its lower half, so taps there never reach
  // the toggle's onPress. Reserving the full half-height here keeps that area clear.
  wrap: { marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: TOGGLE_SIZE / 2 },
  box: { overflow: 'hidden' },
  row: { height: ROW_H },
  // backgroundColor avoids Android's elevation-on-transparent-view bug (a solid grey box instead
  // of a soft shadow) — see Glass.js's shadowWrap for the full explanation.
  shadowWrap: { height: ROW_H, borderRadius: radius.md, backgroundColor: colors.bg, ...shadows.sm },
  card: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  // Small round button overlapping the first row's bottom-right corner — the only hint that
  // there's more below, replacing the old peeking-blur strip.
  toggle: {
    position: 'absolute',
    right: spacing.sm,
    bottom: -TOGGLE_SIZE / 2,
    width: TOGGLE_SIZE,
    height: TOGGLE_SIZE,
    borderRadius: TOGGLE_SIZE / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    ...shadows.sm,
  },
});
```

## `src/components/Waveform.js`
```js
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { mixHex } from '../theme/color';

// Live "audio" waveform: one looping clock on the UI thread drives every bar,
// each bar breathing on its own phase so the shape keeps rolling.
export default function Waveform({
  bars = 17,
  height = 44,
  from,
  to,
  seed = 1,
  speed = 2400,
  style,
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [speed]);

  const shape = useMemo(() => {
    const mid = (bars - 1) / 2;
    return Array.from({ length: bars }, (_, i) => {
      // Taller toward the middle, jittered by a deterministic per-card seed.
      const bell = 1 - Math.abs(i - mid) / (mid + 2);
      const jitter = 0.55 + 0.45 * Math.abs(Math.sin((i + 1) * 12.9898 * seed));
      return {
        base: Math.max(0.18, bell * jitter),
        phase: ((i * 0.137 + seed * 0.31) % 1 + 1) % 1,
        color: mixHex(from, to, i / (bars - 1)),
      };
    });
  }, [bars, seed, from, to]);

  return (
    <View style={[styles.row, { height }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shape.map((b, i) => (
        <Bar key={i} t={t} height={height} {...b} />
      ))}
    </View>
  );
}

function Bar({ t, height, base, phase, color }) {
  const style = useAnimatedStyle(() => {
    const wave = Math.sin((t.value + phase) * Math.PI * 2);
    return { transform: [{ scaleY: base * (0.62 + 0.38 * wave) }] };
  });
  return <Animated.View style={[styles.bar, { height, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { width: 3, borderRadius: 2 },
});
```

## `src/components/DashboardWidgets.js`
```js
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import GlassBlur from './GlassBlur';
import useTween from '../hooks/useTween';
import { colors, chartPalette, fonts, radius, shadows, spacing } from '../theme';

export const PALETTE = [
  chartPalette.sage,
  chartPalette.mint,
  chartPalette.mustard,
  chartPalette.coral,
  chartPalette.violet,
  chartPalette.slate,
];

const ease = Easing.out(Easing.cubic);

// Width that grows from 0 to `pct`% once mounted.
function GrowBar({ pct, color, delay = 0, style }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 900, easing: ease }));
  }, []);
  const s = useAnimatedStyle(() => ({ width: `${Math.max(0, Math.min(100, pct)) * p.value}%` }));
  return <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: 999 }, s, style]} />;
}

// Donut drawn for a light card: every slice sweeps in clockwise together, the centre counts up,
// and the legend lists each slice's share.
export function DonutChart({ data, total, centreLabel, format = (v) => String(Math.round(v)), size = 132 }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sweep = useTween(1, { duration: 1100, from: 0 });
  const sum = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  return (
    <View style={styles.donutRow}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.inkLine} strokeWidth={stroke} fill="none" />
          {data.map((d, i) => {
            const len = (d.value / sum) * c * sweep;
            const gap = data.length > 1 ? 3 : 0;
            const el = (
              <Circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                strokeDashoffset={-offset * sweep}
                strokeLinecap="butt"
              />
            );
            offset += (d.value / sum) * c;
            return el;
          })}
        </Svg>
        <View style={styles.donutCentre} pointerEvents="none">
          <Text style={styles.donutValue}>{format(total * sweep)}</Text>
          <Text style={styles.donutLabel}>{centreLabel}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((d, i) => (
          <View key={d.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
            <Text style={styles.legendName} numberOfLines={1}>{d.label}</Text>
            <Text style={styles.legendPct}>{Math.round((d.value / sum) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// One segmented bar for a whole-catalogue split (in stock / low / out), with counts beneath.
export function HealthBar({ parts }) {
  const sum = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <View>
      <View style={styles.healthTrack}>
        {parts.map((p, i) => (
          <View key={p.label} style={{ flex: Math.max(p.value, 0.0001), marginLeft: i ? 3 : 0 }}>
            <GrowBar pct={100} color={p.color} delay={i * 160} />
          </View>
        ))}
      </View>
      <View style={styles.healthKey}>
        {parts.map((p) => (
          <View key={p.label} style={styles.healthItem}>
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text style={styles.healthNum}>{p.value}</Text>
            <Text style={styles.legendPct} numberOfLines={1}>{p.label} · {Math.round((p.value / sum) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Compact table on a white card. `columns`: [{ key, title, flex, align, render? }]; a column with
// `bar: true` draws a small animated bar scaled to the column's largest value beside its text.
// Each row's bar takes the same `PALETTE[i]` colour as that row's slice in `DonutChart` (both
// read the same top-5-categories list in the same order), so a category keeps one colour across
// every chart on the dashboard instead of each widget inventing its own.
export function DataTable({ columns, rows }) {
  const barCol = columns.find((c) => c.bar);
  const peak = barCol ? Math.max(...rows.map((r) => r[barCol.key]), 1) : 1;
  return (
    // Shadow on this wrapper, clipping (blur + rounded corners) on the table below it —
    // `overflow: 'hidden'` next to Android's `elevation` shadow clips it into a hard line.
    <View style={styles.shadowWrap}>
      <View style={styles.table}>
        <GlassBlur intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        <View style={[styles.tr, styles.thead]}>
          {columns.map((c) => (
            <Text key={c.key} style={[styles.th, { flex: c.flex ?? 1, textAlign: c.align ?? 'left' }]}>{c.title}</Text>
          ))}
        </View>
        {rows.map((r, i) => (
          <View key={r.id ?? i} style={[styles.tr, i === rows.length - 1 && styles.trLast]}>
            {columns.map((c) => (
              <View key={c.key} style={{ flex: c.flex ?? 1 }}>
                <Text style={[styles.td, { textAlign: c.align ?? 'left' }, c.strong && styles.tdStrong]} numberOfLines={1}>
                  {c.render ? c.render(r[c.key], r) : r[c.key]}
                </Text>
                {c.bar ? (
                  <View style={styles.miniTrack}>
                    <GrowBar pct={(r[c.key] / peak) * 100} color={PALETTE[i % PALETTE.length]} delay={i * 90} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  donutCentre: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  donutValue: { color: colors.ink, fontSize: 20, fontFamily: fonts.display, letterSpacing: -0.5 },
  donutLabel: { color: colors.inkMuted, fontSize: 11, fontFamily: fonts.bodySemiBold, marginTop: 1 },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, color: colors.ink, fontSize: 13, fontFamily: fonts.bodySemiBold },
  legendPct: { color: colors.inkMuted, fontSize: 12, fontFamily: fonts.bodySemiBold },

  healthTrack: { flexDirection: 'row', height: 8, marginTop: spacing.md },
  healthKey: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  healthItem: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: spacing.xs / 2 },
  healthNum: { color: colors.ink, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },

  // backgroundColor avoids Android's elevation-on-transparent-view bug (a solid grey box instead
  // of a soft shadow) — see Glass.js's shadowWrap for the full explanation.
  shadowWrap: { borderRadius: radius.md, backgroundColor: colors.bg, ...shadows.sm },
  table: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.7)',
  },
  trLast: { borderBottomWidth: 0 },
  thead: { backgroundColor: 'rgba(255,255,255,0.45)', paddingVertical: spacing.sm },
  // Sentence case, not tracked-out caps — a plain, legible header rather than decorative chrome.
  th: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bodySemiBold },
  td: { color: colors.text, fontSize: 13, fontFamily: fonts.body },
  tdStrong: { fontFamily: fonts.bodyBold },
  miniTrack: { height: 4, borderRadius: 999, backgroundColor: colors.elevated3, marginTop: spacing.xs, overflow: 'hidden' },
});
```

## `src/components/EmptyState.js`
```js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { enter } from '../theme/motion';

// A blank or failed list: say what happened and offer the next step.
// tone 'error' tints the icon red. tone 'locked' is for a feature whose backend API isn't
// live yet — reads as "unlocks soon" rather than a broken screen (amber, no error framing).
export default function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction, tone, index = 0 }) {
  const error = tone === 'error';
  const locked = tone === 'locked';
  return (
    <Animated.View entering={enter(index)} style={styles.wrap}>
      {locked ? (
        <View style={styles.lockedBadge}>
          <Icon name="sparkles" size={11} color={colors.warningStrong} />
          <Text style={styles.lockedBadgeText}>Coming soon</Text>
        </View>
      ) : null}
      <View style={[styles.ring, error && styles.ringError, locked && styles.ringLocked]}>
        <Icon name={icon} size={28} color={error ? colors.danger : locked ? colors.warningStrong : colors.textMuted} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <PressableScale style={styles.action} onPress={onAction} accessibilityLabel={actionLabel}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  ringError: { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}33` },
  ringLocked: { backgroundColor: `${colors.warning}14`, borderColor: `${colors.warning}33` },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: `${colors.warning}1F`,
    marginBottom: spacing.md,
  },
  lockedBadgeText: { fontSize: 11, fontWeight: '700', color: colors.warningStrong, letterSpacing: 0.2 },
  title: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.displayBold,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  action: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
});
```

## `src/components/PressableScale.js`
```js
import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../theme';
import { pressSpring } from '../theme/motion';

// Keyboard focus ring (web): visible only while the control has focus.
const focusRing = Platform.select({
  web: { outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: colors.accentStrong },
  default: {},
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Drop-in touchable that springs down on press instead of flashing opacity.
export default function PressableScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  disabled,
  children,
  sharedScale,
  ...rest
}) {
  const internalScale = useSharedValue(1);
  // Callers that need to drive their own press feedback (e.g. PrimaryButton's fill color) pass
  // in a shared value they created, so that animation reads the exact same press timeline this
  // scale spring runs on, instead of guessing at a second one.
  const scale = sharedScale ?? internalScale;
  const [focused, setFocused] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, pressSpring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, pressSpring);
        onPressOut?.(e);
      }}
      onFocus={(e) => {
        // Ring only for keyboard focus, not mouse/touch clicks.
        try {
          setFocused(Platform.OS === 'web' && !!e.target?.matches?.(':focus-visible'));
        } catch {
          setFocused(false);
        }
      }}
      onBlur={() => setFocused(false)}
      style={[style, animatedStyle, focused && focusRing]}
    >
      {children}
    </AnimatedPressable>
  );
}
```

## `src/components/Icon.js`
```js
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { pressSpring } from '../theme/motion';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// iOS/Android: @animateicons/react renders DOM <svg> and cannot run natively,
// so native keeps Ionicons with a matching spring "pop" on mount and whenever
// `animate` changes. The web build (Icon.web.js) uses the animated Lucide set.
//
// `progress` + `colors` let a caller (e.g. TabBar) drive the glyph's color off the
// same shared value as a surrounding transition, so the icon fades in step with it
// instead of snapping the instant `color` changes.
export default function Icon({ name, size = 20, color, colors, progress, style, animate }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.15, pressSpring), withSpring(1, pressSpring));
  }, [animate, name]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const animatedProps = useAnimatedProps(() => ({
    color: progress && colors ? interpolateColor(progress.value, [0, 1], colors) : color,
  }));

  // Ionicons renders as a Text node whose glyph isn't always centered within its reported
  // `size` box (font metrics vary per glyph — e.g. "albums-outline" vs a symmetric chevron),
  // which reads as a misaligned icon next to siblings in the same row. Pinning this wrapper to
  // an exact size x size box with centered content neutralizes that per-glyph drift.
  if (progress && colors) {
    return (
      <Animated.View style={[styles.box, { width: size, height: size }, animatedStyle, style]}>
        <AnimatedIonicons name={name} size={size} animatedProps={animatedProps} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.box, { width: size, height: size }, animatedStyle, style]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
```
