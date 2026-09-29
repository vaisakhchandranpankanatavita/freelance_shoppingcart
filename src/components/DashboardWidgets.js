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
import useTween from '../hooks/useTween';
import { colors, fonts, radius, spacing } from '../theme';

export const PALETTE = [colors.accent, colors.green, '#F2B33D', colors.danger, '#8B7CF6', '#9A9AA5'];

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

// Donut drawn for a charcoal card: every slice sweeps in clockwise together, the centre counts up,
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
            <Text style={styles.legendPct}>{p.label} · {Math.round((p.value / sum) * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// Compact table on a white card. `columns`: [{ key, title, flex, align, render? }]; a column with
// `bar: true` draws a small animated bar scaled to the column's largest value beside its text.
export function DataTable({ columns, rows }) {
  const barCol = columns.find((c) => c.bar);
  const peak = barCol ? Math.max(...rows.map((r) => r[barCol.key]), 1) : 1;
  return (
    <View style={styles.table}>
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
                  <GrowBar pct={(r[c.key] / peak) * 100} color={colors.green} delay={i * 90} />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md },
  donutCentre: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  donutValue: { color: colors.ink, fontSize: 20, fontFamily: fonts.display, letterSpacing: -0.5 },
  donutLabel: { color: colors.inkMuted, fontSize: 11, fontWeight: '600', marginTop: 1 },
  legend: { flex: 1, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendName: { flex: 1, color: colors.ink, fontSize: 13, fontWeight: '600' },
  legendPct: { color: colors.inkMuted, fontSize: 12, fontWeight: '600' },

  healthTrack: { flexDirection: 'row', height: 14, marginTop: spacing.md },
  healthKey: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  healthItem: { alignItems: 'flex-start', gap: 4 },
  healthNum: { color: colors.ink, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },

  table: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  trLast: { borderBottomWidth: 0 },
  thead: { backgroundColor: colors.elevated2, paddingVertical: 8 },
  th: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  td: { color: colors.text, fontSize: 13, fontWeight: '500' },
  tdStrong: { fontWeight: '700' },
  miniTrack: { height: 4, borderRadius: 999, backgroundColor: colors.elevated3, marginTop: 4, overflow: 'hidden' },
});
