import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing, fonts } from '../theme';

// Horizontal bar list for comparing report rows by value (sale amount, stock worth, quantity, …).
// Report rows are categorical (one per product/category/branch/bill), not a time series, so each
// gets its own bar instead of a point on LineChart's curve.
export default function BarListChart({ data, format = (v) => String(v) }) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <View style={styles.list}>
      {data.map((d, i) => (
        <BarRow key={d.id} label={d.label} sublabel={d.sublabel} value={d.value} max={max} format={d.format ?? format} delay={i * 45} />
      ))}
    </View>
  );
}

function BarRow({ label, sublabel, value, max, format, delay }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(delay, withTiming(Math.max(0, value) / max, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [value, max]);
  const barStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text> : null}
      </View>
      <View style={styles.barCol}>
        <View style={styles.track}>
          <Animated.View style={[styles.bar, barStyle]} />
        </View>
        <Text style={styles.value} numberOfLines={1}>{format(value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  labelCol: { width: 104 },
  label: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.text },
  sublabel: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  barCol: { flex: 1 },
  track: { height: 14, borderRadius: radius.sm, backgroundColor: colors.chip, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: radius.sm, backgroundColor: colors.accentStrong },
  value: { marginTop: 3, fontSize: 11, fontFamily: fonts.bodyBold, color: colors.textMuted, textAlign: 'right' },
});
