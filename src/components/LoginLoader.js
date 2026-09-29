import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PatternBackground from './PatternBackground';
import ShelfScene from '../screens/auth/ShelfScene';
import { colors, fonts, spacing } from '../theme';
import { fadeIn, fadeOut } from '../theme/motion';

const MERGE = 1700; // hero → dots → "O"
const SPIN = 1100;
const RING = 92; // diameter of the O
const STROKE = 7;
const DOT = 14;
const HERO_H = 414; // Sign in hero height below the top safe-area inset (AuthHero)
const SHELF_BOTTOM = 56; // AuthHero paddingBottom under the shelves
const STEPS = ['Signing you in', 'Loading your store', 'Getting the counter ready'];
// The shelf's product colours: each one becomes a dot that flies into the O.
const PALETTE = ['#F2484E', '#F2B33D', '#1ED58A', colors.accent, '#F4F6F8', '#F2484E', '#1ED58A', '#F2B33D'];

const smooth = (x) => {
  'worklet';
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

// One shelf colour: rises off the shelf band and glides along an arc to its slot on the O.
function MergeDot({ i, p, from, to }) {
  const style = useAnimatedStyle(() => {
    const e = smooth((p.value - i * 0.035) / 0.7);
    return {
      opacity: smooth(p.value / 0.12) * (1 - smooth((p.value - 0.82) / 0.16)),
      transform: [
        { translateX: from.x + (to.x - from.x) * e - DOT / 2 },
        { translateY: from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * 46 - DOT / 2 },
        { scale: 1 - 0.25 * e },
      ],
    };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: PALETTE[i] }, style]} />;
}

// Post-login loader that continues the Sign in hero: the charcoal store aisle lifts away,
// its product colours fly together and merge into a single "O", which then spins as the
// loading indicator. `duration` is the whole run.
export default function LoginLoader({ name, duration }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const p = useSharedValue(0); // merge progress 0→1
  const spin = useSharedValue(0);
  const [step, setStep] = useState(0);

  const heroH = insets.top + HERO_H;
  const cx = width / 2;
  const cy = height / 2 - 30;
  const shelfY = heroH - SHELF_BOTTOM - 90; // mid-height of the shelf artwork
  const R = (RING - STROKE) / 2;

  useEffect(() => {
    p.value = withTiming(1, { duration: MERGE, easing: Easing.linear });
    spin.value = withDelay(MERGE - 300, withRepeat(withTiming(1, { duration: SPIN, easing: Easing.linear }), -1));
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), duration / STEPS.length);
    return () => clearInterval(id);
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: 1 - smooth((p.value - 0.05) / 0.4),
    transform: [{ translateY: -smooth(p.value / 0.5) * 60 }, { scale: 1 - smooth(p.value / 0.5) * 0.05 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: smooth((p.value - 0.72) / 0.22),
    transform: [{ scale: 0.86 + 0.14 * smooth((p.value - 0.72) / 0.28) }],
  }));
  const arcStyle = useAnimatedStyle(() => ({
    opacity: smooth((p.value - 0.9) / 0.1),
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: smooth((p.value - 0.85) / 0.15),
    transform: [{ translateY: (1 - smooth((p.value - 0.85) / 0.15)) * 10 }],
  }));

  return (
    <Animated.View exiting={fadeOut} style={styles.fill}>
      <PatternBackground />

      {/* Same charcoal aisle as the Sign in hero, so the hand-off has no cut. */}
      <Animated.View style={[styles.hero, { height: heroH }, heroStyle]}>
        <View style={styles.shelf}>
          <ShelfScene />
        </View>
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {PALETTE.map((_, i) => {
          const a = (i / PALETTE.length) * 2 * Math.PI - Math.PI / 2;
          return (
            <MergeDot
              key={i}
              i={i}
              p={p}
              from={{ x: ((i + 0.5) / PALETTE.length) * width, y: shelfY }}
              to={{ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }}
            />
          );
        })}
      </View>

      <View
        style={[styles.o, { left: cx - RING / 2, top: cy - RING / 2 }]}
        accessibilityRole="progressbar"
        accessibilityLabel="Signing you in"
      >
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.ring, styles.arc, arcStyle]} />
      </View>

      <Animated.View style={[styles.textBlock, { top: cy + RING / 2 + spacing.xl }, textStyle]}>
        <Text style={styles.hello}>Welcome{name ? `, ${name}` : ''}</Text>
        <Animated.Text key={step} entering={fadeIn()} style={styles.step}>
          {STEPS[step]}…
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.bg },
  hero: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.card },
  shelf: { position: 'absolute', left: 0, right: 0, bottom: SHELF_BOTTOM },
  dot: { position: 'absolute', top: 0, left: 0, width: DOT, height: DOT, borderRadius: DOT / 2 },
  o: { position: 'absolute', width: RING, height: RING },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING / 2,
    borderWidth: STROKE,
    borderColor: 'rgba(30,183,235,0.22)',
  },
  arc: { borderColor: 'transparent', borderTopColor: colors.accent, borderRightColor: colors.green },
  textBlock: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hello: { color: colors.text, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },
  step: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 14 },
});
