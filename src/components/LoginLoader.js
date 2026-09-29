import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import Icon from './Icon';
import PatternBackground from './PatternBackground';
import { colors, fonts, spacing } from '../theme';
import { fadeIn, fadeOut } from '../theme/motion';

const SIZE = 120;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const STEPS = ['Signing you in', 'Loading your store', 'Getting the counter ready'];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Dummy post-login loader: a spinning ring that fills while the status line
// cycles through a few steps. Purely cosmetic — `duration` is the whole run.
export default function LoginLoader({ name, duration }) {
  const spin = useSharedValue(0);
  const fill = useSharedValue(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1);
    fill.value = withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) });
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), duration / STEPS.length);
    return () => clearInterval(id);
  }, []);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - fill.value) }));

  return (
    <Animated.View entering={fadeIn()} exiting={fadeOut} style={styles.fill}>
      <PatternBackground />
      <View style={styles.ring}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.elevated3} strokeWidth={STROKE} fill="none" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, spinStyle]}>
          <Svg width={SIZE} height={SIZE}>
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={colors.accent}
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              animatedProps={ringProps}
            />
          </Svg>
        </Animated.View>
        <View style={styles.badge}>
          <Icon name="storefront" size={28} color={colors.ink} />
        </View>
      </View>
      <Text style={styles.hello}>Welcome{name ? `, ${name}` : ''}</Text>
      <Animated.Text key={step} entering={fadeIn()} style={styles.step}>
        {STEPS[step]}…
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hello: { marginTop: spacing.xl, color: colors.text, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },
  step: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 14 },
});
