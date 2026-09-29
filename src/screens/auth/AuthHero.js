import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import ShelfScene from './ShelfScene';
import { colors, spacing, fonts } from '../../theme';
import { enter } from '../../theme/motion';

// Shared top of Sign In / Sign Up: a charcoal store aisle with a scanner beam
// sweeping the shelves. The screen's receipt slip overlaps its lower edge.
export default function AuthHero({ title, subtitle, switchLabel, switchIcon, onSwitch }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.row}>
        <View style={styles.brand} accessibilityLabel="Grocery Admin">
          <View style={styles.mark}>
            <Icon name="basket" size={18} color={colors.ink} />
          </View>
          <Text style={styles.brandText}>Grocery Admin</Text>
        </View>
        {onSwitch ? (
          <PressableScale onPress={onSwitch} style={styles.switch} accessibilityLabel={switchLabel}>
            <Icon name={switchIcon} size={18} color={colors.ink} />
            <Text style={styles.switchText}>{switchLabel}</Text>
          </PressableScale>
        ) : null}
      </View>

      <Animated.Text entering={enter(1)} style={styles.title} accessibilityRole="header">
        {title}
      </Animated.Text>
      {subtitle ? (
        <Animated.Text entering={enter(2)} style={styles.subtitle}>
          {subtitle}
        </Animated.Text>
      ) : null}

      <ShelfScene />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.card, paddingBottom: 56 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inkLine,
  },
  switchText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontFamily: fonts.display,
    letterSpacing: -1,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 15,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});
