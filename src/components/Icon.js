import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { pressSpring } from '../theme/motion';

// iOS/Android: @animateicons/react renders DOM <svg> and cannot run natively,
// so native keeps Ionicons with a matching spring "pop" on mount and whenever
// `animate` changes. The web build (Icon.web.js) uses the animated Lucide set.
export default function Icon({ name, size = 20, color, style, animate }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.15, pressSpring), withSpring(1, pressSpring));
  }, [animate, name]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}
