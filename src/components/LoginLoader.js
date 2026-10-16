import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, fonts } from '../theme';
import { loaderExit } from '../theme/motion';

// Three soft discs in the brand gradient, each breathing (scale) and turning (rotate) on its
// own loop period so the cluster drifts rather than ticking in lockstep — a calm "lava lamp"
// read instead of a literal shape morph, built from plain transforms (cheap, no path morphing).
// x/y are offsets from the center of the `FIELD` box below; the blur on top of the whole box
// is what turns these crisp discs into a soft glow.
const FIELD = 300;
const ORBS = [
  { size: 220, x: -40, y: -30, scalePeriod: 5200, rotatePeriod: 15000, opacity: 0.35 },
  { size: 190, x: 50, y: 20, scalePeriod: 6400, rotatePeriod: 21000, opacity: 0.3 },
  { size: 160, x: -10, y: 50, scalePeriod: 4600, rotatePeriod: 12000, opacity: 0.4 },
];

function Orb({ size, x, y, scalePeriod, rotatePeriod, opacity }) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1, { duration: scalePeriod, easing: Easing.inOut(Easing.sin) }), -1, true);
    rotate.value = withRepeat(withTiming(1, { duration: rotatePeriod, easing: Easing.linear }), -1, false);
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + scale.value * 0.3 }, { rotate: `${rotate.value * 360}deg` }],
  }));
  const position = {
    left: FIELD / 2 - size / 2 + x,
    top: FIELD / 2 - size / 2 + y,
  };

  return (
    <Animated.View style={[styles.orb, position, { width: size, height: size, borderRadius: size / 2, opacity }, style]}>
      <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

// Post-login loader: no longer tied to the Sign in artwork. A calm cluster of brand-gradient
// orbs breathes behind the basket mark (same glyph/chip Splash and the auth hero use) while a
// headline settles in and the bottom pill fills — a loader with its own identity, not a frozen
// Sign in screen with motion layered on top.
export default function LoginLoader({ duration = 3600, label = 'Setting up your store' }) {
  const insets = useSafeAreaInsets();
  const mark = useSharedValue(0);
  const headline = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    mark.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    headline.value = withDelay(250, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) });
  }, []);

  const markStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + mark.value * 0.28,
    transform: [{ scale: 0.75 + mark.value * 0.25 }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + headline.value * 0.28,
    transform: [{ translateY: (1 - headline.value) * 10 }],
  }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      exiting={loaderExit}
      style={styles.fill}
      accessibilityRole="progressbar"
      accessibilityLabel="Signing you in"
    >
      <View style={styles.center}>
        <View style={styles.orbField} pointerEvents="none">
          {ORBS.map((orb, i) => (
            <Orb key={i} {...orb} />
          ))}
          {/* Softens the discs into a blurred glow rather than crisp overlapping circles. */}
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        </View>

        <Animated.View style={[styles.mark, markStyle]}>
          <Icon name="basket" size={40} color={colors.ink} />
        </Animated.View>

        <Animated.Text style={[styles.headline, headlineStyle]}>{label}</Animated.Text>
      </View>

      <View style={[styles.progressTrack, { bottom: insets.bottom + 40 }]} pointerEvents="none">
        <Animated.View style={[styles.progressFill, progressStyle]}>
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbField: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -FIELD / 2,
    marginLeft: -FIELD / 2,
    width: FIELD,
    height: FIELD,
    overflow: 'hidden',
    borderRadius: FIELD / 2,
  },
  orb: { position: 'absolute' },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    marginTop: 18,
    color: colors.ink,
    fontSize: 17,
    fontFamily: fonts.displayBold,
    letterSpacing: -0.2,
  },
  progressTrack: {
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.inkLine,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
});
