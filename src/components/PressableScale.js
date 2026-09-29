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
  ...rest
}) {
  const scale = useSharedValue(1);
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
