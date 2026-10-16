import React, { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../theme';
import { pressSpring } from '../theme/motion';

// Keyboard focus ring (web): visible only while the control has focus.
const focusRing = Platform.select({
  web: { outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: colors.accentStrong },
  default: {},
});

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Drop-in touchable that springs down on press instead of flashing opacity.
export default function PressableScale({
  scaleTo = 0.96,
  style,
  onPressIn,
  onPressOut,
  disabled,
  children,
  sharedScale,
  ...rest
}) {
  const internalScale = useSharedValue(1);
  // Callers that need to drive their own press feedback (e.g. PrimaryButton's fill color) pass
  // in a shared value they created, so that animation reads the exact same press timeline this
  // scale spring runs on, instead of guessing at a second one.
  const scale = sharedScale ?? internalScale;
  const [focused, setFocused] = useState(false);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, pressSpring);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, pressSpring);
        onPressOut?.(e);
      }}
      onFocus={(e) => {
        // Ring only for keyboard focus, not mouse/touch clicks.
        try {
          setFocused(Platform.OS === 'web' && !!e.target?.matches?.(':focus-visible'));
        } catch {
          setFocused(false);
        }
      }}
      onBlur={() => setFocused(false)}
      style={[style, animatedStyle, focused && focusRing]}
    >
      {children}
    </AnimatedPressable>
  );
}
