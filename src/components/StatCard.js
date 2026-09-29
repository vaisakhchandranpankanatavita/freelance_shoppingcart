import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from './Icon';
import { colors, radius, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';

export default function StatCard({ icon, label, value, delta, index = 0, style }) {
  return (
    <Animated.View entering={enter(index)} style={[styles.card, style]}>
      <View style={styles.iconBox}>
        <Icon name={icon} size={18} color={colors.ink} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {delta ? (
        <View style={styles.deltaRow}>
          <Icon name="trending-up" size={12} color={colors.ink} />
          <Text style={styles.delta}>{delta} vs last month</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 18,
    minHeight: 170,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  value: { fontSize: 28, fontFamily: fonts.display, letterSpacing: -1, color: colors.ink },
  label: { fontSize: 13, color: colors.inkMuted, marginTop: 2 },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  delta: { color: colors.ink, fontSize: 11, fontWeight: '600' },
});
