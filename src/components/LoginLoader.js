import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthHero, { AUTH_SHELF_TOP } from '../screens/auth/AuthHero';
import { SCENE_H, Shelf, shelfFit } from '../screens/auth/ShelfScene';
import { colors } from '../theme';
import { loaderExit } from '../theme/motion';

const RAMP = 0.9; // seconds for the rows to reach full speed
const SPEED = { upper: 210, lower: 290 }; // px/s, both rightwards; the lower row is quicker for depth
const GLIDE = 1100; // ms the Sign in title and brand take to fade out
const UPPER_H = 120; // scene units: the upper shelf is the top 120 of the 400×210 artwork

const smooth = (x) => {
  'worklet';
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

// Distance a row has flowed after `t` seconds: eases up to full speed, then constant.
const travelled = (t, v) => {
  'worklet';
  return t < RAMP ? (v * t * t) / (2 * RAMP) : v * (t - RAMP / 2);
};

// One shelf of the Sign in artwork, drawn twice side by side so it can slide right forever:
// when it has moved one width, the second copy sits exactly where the first started.
function Row({ group, width, height, viewBox, clock }) {
  const v = SPEED[group];
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (travelled(clock.value, v) % width) - width }],
  }));
  return (
    <Animated.View style={[styles.row, { width: width * 2, height }, style]}>
      {[0, 1].map((k) => (
        <Svg key={k} width={width} height={height} viewBox={viewBox} preserveAspectRatio="xMidYMax slice">
          <Shelf group={group} />
        </Svg>
      ))}
    </Animated.View>
  );
}

// Post-login transition built from the Sign in hero itself: the title and brand fade, then the
// very same two shelves — exactly the Sign in image's width, height and position — stay put and
// slide to the right as endless loops until the app is ready. Progress runs along the bottom, as on the splash.
export default function LoginLoader({ duration = 3600 }) {
  // Sized from its own layout, not the window: on desktop web the app sits in a narrow phone frame.
  const [{ width }, setSize] = useState({ width: 0 });
  const insets = useSafeAreaInsets();
  const clock = useSharedValue(0); // seconds since the loader opened
  const glide = useSharedValue(0); // 0 = Sign in hero shown, 1 = hero faded out
  const progress = useSharedValue(0);

  useEffect(() => {
    clock.value = withTiming((duration + 2000) / 1000, { duration: duration + 2000, easing: Easing.linear });
    glide.value = withTiming(1, { duration: GLIDE, easing: Easing.inOut(Easing.cubic) });
    progress.value = withTiming(1, { duration, easing: Easing.inOut(Easing.cubic) });
  }, []);

  // Sign in draws the 400×210 scene at scale `s` in a 210-tall box, bottom-aligned, so on wide
  // screens its top `y0` scene units are cropped. Draw exactly the same window, split per shelf.
  const { s, ty } = shelfFit(width || 1);
  const top = insets.top + AUTH_SHELF_TOP; // where Sign in draws the shelves
  const y0 = -ty / s;
  const upperTop = Math.min(y0, UPPER_H);
  const lowerTop = Math.max(y0, UPPER_H);
  const upperH = (UPPER_H - upperTop) * s;
  const lowerH = (SCENE_H - lowerTop) * s;

  const heroStyle = useAnimatedStyle(() => ({ opacity: 1 - smooth(glide.value / 0.35) }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      exiting={loaderExit}
      style={styles.fill}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
      accessibilityRole="progressbar"
      accessibilityLabel="Signing you in"
    >
      {/* The Sign in hero, frozen: brand, title and empty shelves. */}
      <Animated.View style={[styles.hero, heroStyle]} pointerEvents="none">
        <AuthHero
          still
          title="Sign in"
          subtitle="Open your counter for today's shift."
          switchLabel="Sign up"
          switchIcon="person-circle-outline"
          onSwitch={() => {}}
        />
      </Animated.View>

      {width ? (
        <Animated.View style={[styles.stage, { top, width, height: upperH + lowerH }]} pointerEvents="none">
          {upperH > 0 ? (
            <View style={{ width, height: upperH, overflow: 'hidden' }}>
              <Row group="upper" width={width} height={upperH} viewBox={`0 ${upperTop} 400 ${UPPER_H - upperTop}`} clock={clock} />
            </View>
          ) : null}
          <View style={{ width, height: lowerH, overflow: 'hidden' }}>
            <Row group="lower" width={width} height={lowerH} viewBox={`0 ${lowerTop} 400 ${SCENE_H - lowerTop}`} clock={clock} />
          </View>
        </Animated.View>
      ) : null}

      <View style={styles.progressTrack} pointerEvents="none">
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
  // Same charcoal as the Sign in hero, so the hand-off is one continuous surface.
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.card, overflow: 'hidden' },
  hero: { position: 'absolute', top: 0, left: 0, right: 0 },
  stage: { position: 'absolute', left: 0 },
  row: { flexDirection: 'row' },
  progressTrack: {
    position: 'absolute',
    bottom: 40,
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
