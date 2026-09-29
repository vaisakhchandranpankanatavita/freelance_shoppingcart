import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// The app-wide canvas: a soft cream → grey-cyan diagonal (135°) gradient. Sits behind
// content and ignores touches. Kept under its old name — every screen shell already mounts it.
export default function PatternBackground() {
  return (
    <LinearGradient
      colors={colors.bgGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
