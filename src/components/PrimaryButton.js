import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import GradientBorder from './GradientBorder';
import { colors, typography } from '../theme';

const BAND = 72;

// A light band that sweeps across the button like a scanner while `loadingLabel` shows.
function SweepLoader({ label, color }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const dots = useSharedValue(0);

  useEffect(() => {
    if (!width) return;
    x.value = 0;
    x.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      -1,
    );
    dots.value = withRepeat(
      withSequence(withTiming(1, { duration: 450 }), withTiming(0.35, { duration: 450 })),
      -1,
    );
  }, [width]);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -BAND + x.value * (width + BAND) }, { skewX: '-20deg' }],
  }));
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dots.value }));

  return (
    <View style={StyleSheet.absoluteFill} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.band, bandStyle]} />
      <Animated.View entering={FadeIn.duration(160)} style={styles.center}>
        <Text style={[typography.button, { color }]}>{label}</Text>
        <Animated.Text style={[typography.button, { color }, dotsStyle]}>...</Animated.Text>
      </Animated.View>
    </View>
  );
}

// variant: 'gradient' (outlined, the hero CTA) | 'light' (cyan pill) | 'dark' (graphite pill)
// square: sharp corners instead of a pill.
// loadingLabel: replaces the spinner with a sweeping "{label}..." animation.
export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'gradient',
  square = false,
  compact = false,
  loadingLabel,
  icon,
  style,
}) {
  const fg = variant === 'light' ? colors.ink : colors.text;
  let content;
  if (loading && loadingLabel) content = <SweepLoader label={loadingLabel} color={fg} />;
  else if (loading) content = <ActivityIndicator color={fg} />;
  else
    content = (
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={20} color={fg} /> : null}
        <Text style={[typography.button, { color: fg }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  const btn = [styles.btn, square && styles.square, compact && styles.compact];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[disabled && { opacity: 0.5 }, style]}
    >
      {variant === 'gradient' ? (
        <GradientBorder width={2} borderRadius={square ? 0 : 999} innerStyle={btn}>
          {content}
        </GradientBorder>
      ) : (
        <View
          style={[
            btn,
            { backgroundColor: variant === 'light' ? colors.accent : colors.elevated2 },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  square: { borderRadius: 0 },
  compact: { height: 44, minWidth: 148, paddingHorizontal: 20, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  band: {
    position: 'absolute',
    top: -8,
    bottom: -8,
    width: BAND,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  center: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
