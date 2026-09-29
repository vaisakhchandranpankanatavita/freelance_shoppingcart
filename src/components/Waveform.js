import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { mixHex } from '../theme/color';

// Live "audio" waveform: one looping clock on the UI thread drives every bar,
// each bar breathing on its own phase so the shape keeps rolling.
export default function Waveform({
  bars = 17,
  height = 44,
  from,
  to,
  seed = 1,
  speed = 2400,
  style,
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: speed, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [speed]);

  const shape = useMemo(() => {
    const mid = (bars - 1) / 2;
    return Array.from({ length: bars }, (_, i) => {
      // Taller toward the middle, jittered by a deterministic per-card seed.
      const bell = 1 - Math.abs(i - mid) / (mid + 2);
      const jitter = 0.55 + 0.45 * Math.abs(Math.sin((i + 1) * 12.9898 * seed));
      return {
        base: Math.max(0.18, bell * jitter),
        phase: ((i * 0.137 + seed * 0.31) % 1 + 1) % 1,
        color: mixHex(from, to, i / (bars - 1)),
      };
    });
  }, [bars, seed, from, to]);

  return (
    <View style={[styles.row, { height }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {shape.map((b, i) => (
        <Bar key={i} t={t} height={height} {...b} />
      ))}
    </View>
  );
}

function Bar({ t, height, base, phase, color }) {
  const style = useAnimatedStyle(() => {
    const wave = Math.sin((t.value + phase) * Math.PI * 2);
    return { transform: [{ scaleY: base * (0.62 + 0.38 * wave) }] };
  });
  return <Animated.View style={[styles.bar, { height, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { width: 3, borderRadius: 2 },
});
