import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import PatternBackground from './PatternBackground';
import { colors, fonts, spacing } from '../theme';
import { fadeIn, fadeOut } from '../theme/motion';

const COLS = 9;
const DOT = 10;
const GAP = 14;
const MID = (COLS - 1) / 2;
const MAX_D = Math.hypot(MID, MID);
const CYCLE = 1800;
const STEPS = ['Signing you in', 'Loading your store', 'Getting the counter ready'];
const DOTS = Array.from({ length: COLS * COLS }, (_, i) => {
  const x = i % COLS;
  const y = Math.floor(i / COLS);
  return { key: i, x, y, d: Math.hypot(x - MID, y - MID) / MAX_D };
});

// One dot of the grid: a wave travelling out from the centre swells it and
// lights it up as the ripple passes.
function RippleDot({ d, t }) {
  const style = useAnimatedStyle(() => {
    const v = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t.value - d));
    return { opacity: 0.25 + 0.75 * v, transform: [{ scale: 0.45 + 0.85 * v }] };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

// Dummy post-login loader: a grid of dots with a ripple spreading from the
// centre while the status line cycles through a few steps. Purely cosmetic —
// `duration` is the whole run.
export default function LoginLoader({ name, duration }) {
  const t = useSharedValue(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: CYCLE, easing: Easing.linear }), -1);
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), duration / STEPS.length);
    return () => clearInterval(id);
  }, []);

  return (
    <Animated.View entering={fadeIn()} exiting={fadeOut} style={styles.fill}>
      <PatternBackground />
      <View style={styles.grid} accessibilityRole="progressbar" accessibilityLabel="Signing you in">
        {DOTS.map((p) => (
          <RippleDot key={p.key} d={p.d} t={t} />
        ))}
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
  grid: {
    width: COLS * DOT + (COLS - 1) * GAP,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: colors.accent },
  hello: { marginTop: spacing.xl, color: colors.text, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },
  step: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 14 },
});
