import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import PressableScale from '../../components/PressableScale';
import Heading from '../../components/Heading';
import { colors, spacing } from '../../theme';
import { enter } from '../../theme/motion';

const HEIGHT = 300;
// White sheet with the reference's liquid lower edge (viewBox 400×300).
const WAVE =
  'M0 0H400V120C372 150 362 212 330 244C290 284 232 292 182 276C124 258 92 214 0 204Z';

// Shared top of Sign In / Sign Up: brand mark, switch link, big centred title.
export default function AuthHero({ title, switchLabel, switchIcon, onSwitch }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={SlideInUp.springify().damping(20).stiffness(140)}
      style={{ height: HEIGHT + insets.top }}
    >
      <View style={[StyleSheet.absoluteFill, { top: insets.top }]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none">
          <Path d={WAVE} fill={colors.card} />
        </Svg>
      </View>
      <View style={[styles.topFill, { height: insets.top + 1 }]} />

      <View style={[styles.row, { marginTop: insets.top + spacing.lg }]}>
        <View style={styles.mark} accessibilityLabel="Grocery">
          <Icon name="basket" size={20} color={colors.text} />
        </View>
        {onSwitch ? (
          <PressableScale onPress={onSwitch} style={styles.switch} accessibilityLabel={switchLabel}>
            <Icon name={switchIcon} size={22} color={colors.ink} />
            <Text style={styles.switchText}>{switchLabel}</Text>
          </PressableScale>
        ) : null}
      </View>

      <Heading level="display" tone="light" entering={enter(2)} style={styles.title}>
        {title}
      </Heading>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topFill: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.card },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  mark: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switch: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  switchText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  title: { textAlign: 'center', fontSize: 48, lineHeight: 52, marginTop: 44 },
});
