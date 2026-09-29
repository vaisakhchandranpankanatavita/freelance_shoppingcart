import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { colors, spacing } from '../theme';
import { enter } from '../theme/motion';

// Action row pinned above the tab bar. Scrolling content fades out beneath it
// instead of running into the buttons; pair with ~140px of scroll padding.
export default function BottomBar({ children, style, index = 4 }) {
  return (
    <Animated.View entering={enter(index)} style={styles.wrap} pointerEvents="box-none">
      <LinearGradient
        colors={[`${colors.bg}00`, colors.bg]}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[styles.row, style]}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: spacing.xl },
  row: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
});
