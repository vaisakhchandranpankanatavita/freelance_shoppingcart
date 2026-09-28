import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';

export default function StatCard({ icon, label, value, delta, tint = colors.primary }) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {delta ? (
        <View style={styles.deltaRow}>
          <Ionicons name="trending-up" size={12} color={colors.success} />
          <Text style={styles.delta}>{delta}</Text>
        </View>
      ) : null}
      <Text style={styles.footNote}>Compared to last month</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  value: { fontSize: 20, fontWeight: '700', color: colors.text },
  deltaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  delta: { color: colors.success, fontSize: 11, fontWeight: '600', marginLeft: 2 },
  footNote: { fontSize: 10, color: colors.muted, marginTop: 4 },
});
