import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import LineChart from './LineChart';
import { colors, chartPalette, fonts, spacing } from '../theme';
import { rupeesShort } from '../utils/format';

const ease = Easing.out(Easing.cubic);

// A bar that grows from the baseline to `pct` of its track once mounted.
function Bar({ pct, color, delay = 0, style }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 800, easing: ease }));
  }, []);
  const s = useAnimatedStyle(() => ({ height: `${Math.max(0, Math.min(100, pct)) * p.value}%` }));
  return <Animated.View style={[{ width: '100%', backgroundColor: color, borderRadius: 3 }, s, style]} />;
}

// Round the axis maximum up to a tidy 1/2/5 step so ticks read cleanly.
const niceMax = (v) => {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
};

// Daily revenue as a smooth area line you can scrub with a finger.
export function RevenueTrend({ data }) {
  const points = data.map((d) => Number(d.revenue) || 0);
  const total = points.reduce((s, v) => s + v, 0);
  const max = niceMax(Math.max(...points));
  const last = data.length - 1;
  const labels = [0, 0.25, 0.5, 0.75, 1].map((f) => data[Math.round(f * last)]?.date ?? '');
  if (points.length < 2) return null;
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.big}>{rupeesShort(total)}</Text>
        <Text style={styles.sub}>{total ? 'revenue · last 30 days' : 'no sales recorded yet'}</Text>
      </View>
      <LineChart
        series={{ labels, points }}
        max={max}
        ticks={[0, max / 3, (2 * max) / 3, max]}
        height={150}
        format={rupeesShort}
        initialIndex={last}
      />
    </View>
  );
}

// 24 bars, one per hour; the busiest hour is highlighted.
export function PeakHours({ data }) {
  const counts = data.map((h) => Number(h.bill_count) || 0);
  const peak = Math.max(...counts);
  const peakAt = counts.indexOf(peak);
  const [sel, setSel] = useState(null);
  const shown = sel ?? (peak > 0 ? peakAt : null);
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.big}>{shown != null ? data[shown].label : '—'}</Text>
        <Text style={styles.sub}>
          {shown != null ? `${counts[shown]} ${counts[shown] === 1 ? 'bill' : 'bills'}${sel == null ? ' · busiest hour' : ''}` : 'no bills in this period'}
        </Text>
      </View>
      <View style={styles.bars}>
        {counts.map((c, i) => (
          <View key={i} style={styles.barCol} onTouchStart={() => setSel(i)} onTouchEnd={() => setSel(null)}>
            <View style={styles.barTrack}>
              <Bar
                pct={peak ? Math.max((c / peak) * 100, c ? 6 : 3) : 3}
                color={i === shown && peak > 0 ? colors.accent : c ? chartPalette.mint : colors.inkLine}
                delay={i * 25}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.axisRow}>
        {['12a', '6a', '12p', '6p', '11p'].map((l) => (
          <Text key={l} style={styles.axisText}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// New bills vs refunds, month by month, as paired bars.
export function MonthlyBills({ monthly }) {
  const { months, new_bills: nb = {}, refunds: rf = {} } = monthly;
  const rows = useMemo(() => months.map((m) => ({ m, n: Number(nb[m]) || 0, r: Number(rf[m]) || 0 })), [monthly]);
  const peak = Math.max(1, ...rows.map((r) => Math.max(r.n, r.r)));
  const total = rows.reduce((s, r) => s + r.n, 0);
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.big}>{total}</Text>
        <Text style={styles.sub}>bills this year</Text>
        <View style={styles.keys}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text style={styles.key}>New</Text>
          <View style={[styles.dot, { backgroundColor: colors.danger }]} />
          <Text style={styles.key}>Refunds</Text>
        </View>
      </View>
      <View style={styles.monthBars}>
        {rows.map((r, i) => (
          <View key={r.m} style={styles.monthCol}>
            <View style={styles.monthPair}>
              <View style={styles.monthTrack}>
                <Bar pct={r.n ? Math.max((r.n / peak) * 100, 6) : 2} color={r.n ? colors.accent : colors.inkLine} delay={i * 50} />
              </View>
              <View style={styles.monthTrack}>
                <Bar pct={r.r ? Math.max((r.r / peak) * 100, 6) : 2} color={r.r ? colors.danger : colors.inkLine} delay={i * 50 + 60} />
              </View>
            </View>
            <Text style={styles.axisText}>{r.m[0]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.sm },
  big: { color: colors.ink, fontSize: 20, fontFamily: fonts.display, letterSpacing: -0.5 },
  sub: { flex: 1, color: colors.inkMuted, fontSize: 11, fontFamily: fonts.bodySemiBold },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 2 },
  barCol: { flex: 1, height: '100%' },
  barTrack: { flex: 1, justifyContent: 'flex-end' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  axisText: { color: colors.textFaint, fontSize: 9, fontFamily: fonts.bodySemiBold, textAlign: 'center' },
  keys: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  key: { color: colors.inkMuted, fontSize: 10, fontFamily: fonts.bodySemiBold, marginRight: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  monthBars: { flexDirection: 'row', gap: 4, height: 84 },
  monthCol: { flex: 1, alignItems: 'center', gap: 3 },
  monthPair: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  monthTrack: { flex: 1, height: '100%', justifyContent: 'flex-end' },
});
