import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { colors, spacing } from '../theme';
import { enter } from '../theme/motion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Action row pinned to the bottom of a sub-flow screen. Every screen that uses it hides the
// floating tab bar (TabBar.js HIDE_BAR_SCREENS), so it only clears the device's home indicator —
// reserving the tab bar's height as well left an empty dark band under the buttons. The gradient deepens the last stretch into the same dark
// plum as the TabBar beneath it, so the "light" PrimaryButton variant these screens pass in has
// solid ground to read against. A hairline catches the light right where the fade settles into
// that solid plum, the same "bright edge defines the surface" cue GlassCard uses elsewhere.
export default function BottomBar({ children, style, index = 4 }) {
  const { bottom } = useSafeAreaInsets();
  const clearance = Math.max(bottom, spacing.md) + spacing.sm;
  return (
    <Animated.View entering={enter(index)} style={styles.wrap} pointerEvents="box-none">
      <LinearGradient
        colors={[`${colors.bar}00`, `${colors.bar}66`, `${colors.bar}F2`, colors.bar]}
        locations={[0, 0.3, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.hairline} pointerEvents="none" />
      <View style={[styles.row, { paddingBottom: clearance }, style]}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: spacing.xl },
  // Sits at the same 0.6 location as the gradient's near-solid stop, so it reads as the top
  // edge of the plum surface rather than a line floating in the fade.
  hairline: { position: 'absolute', left: 0, right: 0, top: '60%', height: 1, backgroundColor: `${colors.barSoft}4D` },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg },
});
