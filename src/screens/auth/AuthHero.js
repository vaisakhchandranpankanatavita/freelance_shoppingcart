import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import ShelfScene from './ShelfScene';
import { colors, spacing, fonts } from '../../theme';
import { enter } from '../../theme/motion';

// Distance from the top safe-area edge to the shelves: padding 16 + brand row 32 +
// title margin 24 + title 38 + subtitle margin 4 + subtitle 20 + gap 16. Every line
// height above is explicit, so the splash and loader can land the artwork exactly here.
export const AUTH_SHELF_TOP = 150;
export const BRAND_MARK_TAG = 'brandMark'; // shared element: Splash's basket flies into this corner mark
export const AUTH_SHELF_BOTTOM = 56; // hero padding under the shelves
export const AUTH_HERO_H = AUTH_SHELF_TOP + 210 + AUTH_SHELF_BOTTOM;

// Shared top of Sign In / Sign Up: a charcoal store aisle with a scanner beam
// sweeping the shelves. The screen's receipt slip overlaps its lower edge.
// `still` freezes it into a static frame — no entrance animations, empty shelves — which the
// post-login loader shows first so Sign in melts into it without a cut.
export default function AuthHero({ title, subtitle, switchLabel, switchIcon, onSwitch, still = false }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.row}>
        <View style={styles.brand} accessibilityLabel="Grocery Admin">
          <Animated.View sharedTransitionTag={BRAND_MARK_TAG} style={styles.mark}>
            <Icon name="basket" size={18} color={colors.ink} />
          </Animated.View>
          <Text style={styles.brandText}>Grocery Admin</Text>
        </View>
        {onSwitch ? (
          <PressableScale onPress={onSwitch} style={styles.switch} accessibilityLabel={switchLabel}>
            <Icon name={switchIcon} size={18} color={colors.ink} />
            <Text style={styles.switchText}>{switchLabel}</Text>
          </PressableScale>
        ) : null}
      </View>

      <Animated.Text entering={still ? undefined : enter(1)} style={styles.title} accessibilityRole="header">
        {title}
      </Animated.Text>
      {subtitle ? (
        <Animated.Text entering={still ? undefined : enter(2)} style={styles.subtitle}>
          {subtitle}
        </Animated.Text>
      ) : null}

      <ShelfScene bare={still} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.card, paddingBottom: AUTH_SHELF_BOTTOM },
  row: {
    height: 32,
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
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
});
