import React from 'react';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Gradient outline: a gradient layer with an inset fill on top. The inner surface is an
// Animated.View (not a plain View) so a caller can pass a reanimated style — e.g. PrimaryButton
// animating its press-state fill — straight into `innerStyle`.
export default function GradientBorder({
  width = 1.5,
  borderRadius = 999,
  fill = colors.bg,
  style,
  innerStyle,
  children,
}) {
  return (
    <LinearGradient
      colors={colors.gradient}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[{ borderRadius, padding: width }, style]}
    >
      <Animated.View style={[{ borderRadius: Math.max(0, borderRadius - width), backgroundColor: fill }, innerStyle]}>
        {children}
      </Animated.View>
    </LinearGradient>
  );
}
