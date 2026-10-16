import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import GradientBorder from './GradientBorder';
import { colors, radius, shadows, typography } from '../theme';

const PRESS_SCALE = 0.96;

// Fill color to settle into under a finger, per variant — a shade deeper than the resting
// fill, same hue, so pressing reads as the surface darkening rather than a flat opacity flash.
const PRESSED_FILL = {
  light: colors.ctaStrong,
  dark: colors.chip,
  gradient: colors.cardFade,
};

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

// variant: 'gradient' (outlined CTA) | 'light' (accent fill) | 'dark' (quiet neutral fill)
// square: sharp corners instead of the standard rounded rectangle.
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
  const fg = variant === 'light' ? colors.onCta : colors.text;
  // Shared with PressableScale so the fill's color settles into its pressed shade on the exact
  // same spring driving the squish, instead of a second animation racing it.
  const scale = useSharedValue(1);
  const restFill = variant === 'light' ? colors.cta : variant === 'dark' ? colors.elevated2 : colors.bg;
  const fillStyle = useAnimatedStyle(() => {
    const t = interpolate(scale.value, [PRESS_SCALE, 1], [1, 0], Extrapolation.CLAMP);
    return { backgroundColor: interpolateColor(t, [0, 1], [PRESSED_FILL[variant], restFill]) };
  });
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
  // The button content clips to its own rounded corners (for the sweep loader band), so the
  // shadow has to live one layer up on this wrapper instead — same radius, never clipped.
  const buttonRadius = compact ? 10 : square ? 0 : radius.md;
  const innerRadius = Math.max(0, buttonRadius - 2);

  return (
    <PressableScale
      scaleTo={PRESS_SCALE}
      sharedScale={scale}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[{ borderRadius: buttonRadius }, shadows.sm, disabled && { opacity: 0.5 }, style]}
    >
      {variant === 'gradient' ? (
        <GradientBorder width={2} borderRadius={buttonRadius} innerStyle={[btn, fillStyle, { borderRadius: innerRadius }]}>
          {content}
        </GradientBorder>
      ) : (
        <Animated.View style={[btn, fillStyle]}>{content}</Animated.View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: radius.md,
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
