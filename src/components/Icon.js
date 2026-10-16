import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { pressSpring } from '../theme/motion';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

// iOS/Android: @animateicons/react renders DOM <svg> and cannot run natively,
// so native keeps Ionicons with a matching spring "pop" on mount and whenever
// `animate` changes. The web build (Icon.web.js) uses the animated Lucide set.
//
// `progress` + `colors` let a caller (e.g. TabBar) drive the glyph's color off the
// same shared value as a surrounding transition, so the icon fades in step with it
// instead of snapping the instant `color` changes.
export default function Icon({ name, size = 20, color, colors, progress, style, animate }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.15, pressSpring), withSpring(1, pressSpring));
  }, [animate, name]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const animatedProps = useAnimatedProps(() => ({
    color: progress && colors ? interpolateColor(progress.value, [0, 1], colors) : color,
  }));

  // Ionicons renders as a Text node whose glyph isn't always centered within its reported
  // `size` box (font metrics vary per glyph — e.g. "albums-outline" vs a symmetric chevron),
  // which reads as a misaligned icon next to siblings in the same row. Pinning this wrapper to
  // an exact size x size box with centered content neutralizes that per-glyph drift.
  if (progress && colors) {
    return (
      <Animated.View style={[styles.box, { width: size, height: size }, animatedStyle, style]}>
        <AnimatedIonicons name={name} size={size} animatedProps={animatedProps} />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.box, { width: size, height: size }, animatedStyle, style]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
