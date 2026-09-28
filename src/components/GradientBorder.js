import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// Gradient outline: a gradient layer with an inset fill on top.
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
      <View style={[{ borderRadius: Math.max(0, borderRadius - width), backgroundColor: fill }, innerStyle]}>
        {children}
      </View>
    </LinearGradient>
  );
}
