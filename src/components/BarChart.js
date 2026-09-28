import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';
import { spring } from '../theme/motion';

function Bar({ height, delay, gradient }) {
  const h = useSharedValue(0);
  useEffect(() => {
    h.value = withDelay(delay, withSpring(height, spring));
  }, [height, delay]);
  const style = useAnimatedStyle(() => ({ height: h.value }));

  return (
    <Animated.View style={[styles.bar, !gradient && styles.barMuted, style]}>
      {gradient ? (
        <LinearGradient
          colors={[colors.gradient[2], colors.gradient[1], colors.gradient[0]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </Animated.View>
  );
}

// a = purchase, b = sales. Bars grow in with a staggered spring on mount.
export default function BarChart({ data = [], height = 160 }) {
  const max = Math.max(...data.map((d) => Math.max(d.a || 0, d.b || 0)), 1);
  const plot = height - 20;
  return (
    <View accessibilityLabel="Sales and purchase bar chart">
      <View style={[styles.row, { height }]}>
        {data.map((d, i) => (
          <View key={d.label} style={styles.group}>
            <View style={styles.barsRow}>
              <Bar height={((d.a || 0) / max) * plot} delay={i * 45} />
              <Bar height={((d.b || 0) / max) * plot} delay={i * 45 + 25} gradient />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.elevated3 }]} />
          <Text style={styles.legendText}>Purchase</Text>
        </View>
        <View style={styles.legendItem}>
          <LinearGradient colors={colors.gradient} style={styles.legendDot} />
          <Text style={styles.legendText}>Sales</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  group: { flex: 1, alignItems: 'center' },
  barsRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 7, borderRadius: 4, overflow: 'hidden' },
  barMuted: { backgroundColor: colors.elevated3 },
  label: { fontSize: 10, color: colors.textMuted, marginTop: 6 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md, gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { fontSize: 12, color: colors.textMuted },
});
