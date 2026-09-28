import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../theme';

export default function BarChart({ data = [], height = 160 }) {
  const max = Math.max(...data.map((d) => Math.max(d.a || 0, d.b || 0)), 1);
  return (
    <View>
      <View style={[styles.row, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.group}>
            <View style={styles.barsRow}>
              <View
                style={[
                  styles.bar,
                  {
                    height: ((d.a || 0) / max) * (height - 20),
                    backgroundColor: colors.chartBarDark,
                  },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: ((d.b || 0) / max) * (height - 20),
                    backgroundColor: colors.chartBarLight,
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.chartBarDark }]} />
          <Text style={styles.legendText}>Purchase</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.chartBarLight }]} />
          <Text style={styles.legendText}>Sales</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  group: { flex: 1, alignItems: 'center' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 2 },
  bar: { width: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  label: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm, gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 11, color: colors.textMuted },
});
