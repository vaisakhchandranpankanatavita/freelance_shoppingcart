import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import GlassBlur from './GlassBlur';
import { colors } from '../theme';

// The app-wide canvas: a near-solid warm-linen wash, drawn top → bottom. When a `tint` is given
// (every in-app screen passes its section's tint, see theme `sectionTints`), a soft aura of three
// blurred orbs glows behind the top of the screen — the same treatment the dashboard introduced,
// so every section shares one look and only the hue tells them apart. The orbs breathe slowly;
// with reduced motion on they hold still. Sits behind content and ignores touches.
const ORBS = [
  { size: 300, top: -100, right: -60, scalePeriod: 5600, rotatePeriod: 16000, opacity: 0.7 },
  { size: 250, top: 50, left: -90, scalePeriod: 6800, rotatePeriod: 22000, opacity: 0.6 },
  { size: 200, top: 160, right: 30, scalePeriod: 4800, rotatePeriod: 13000, opacity: 0.5 },
];

function Orb({ tint, size, top, left, right, scalePeriod, rotatePeriod, opacity, still }) {
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    scale.value = withRepeat(withTiming(1, { duration: scalePeriod, easing: Easing.inOut(Easing.sin) }), -1, true);
    rotate.value = withRepeat(withTiming(1, { duration: rotatePeriod, easing: Easing.linear }), -1, false);
  }, [still]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.88 + scale.value * 0.25 }, { rotate: `${rotate.value * 360}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { top, left, right, width: size, height: size, borderRadius: size / 2, opacity },
        animatedStyle,
      ]}
    >
      <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export default function PatternBackground({ tint }) {
  const still = useReducedMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={colors.bgGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {tint ? (
        <View style={styles.aura}>
          <LinearGradient
            colors={[`${tint[0]}80`, `${tint[0]}33`, `${colors.bg}00`]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          {ORBS.map((orb, i) => (
            <Orb key={i} tint={tint} still={still} {...orb} />
          ))}
          <GlassBlur intensity={45} tint="light" style={StyleSheet.absoluteFill} />
          {/* Fade the aura's lower edge into the canvas so it never ends on a visible line. */}
          <LinearGradient
            colors={[`${colors.bgGradient[0]}00`, colors.bgGradient[0]]}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' },
  orb: { position: 'absolute', overflow: 'hidden' },
});
