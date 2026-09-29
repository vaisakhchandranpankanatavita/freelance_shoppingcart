import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import ShelfScene from './ShelfScene';
import { AUTH_SHELF_TOP } from './AuthHero';
import { colors, fonts } from '../../theme';

const HOLD = 4400; // everything has settled and rests before the hand-off
const EXIT = 1300; // hand-off: branding fades, shelves glide up to where Login draws them
const DURATION = HOLD + EXIT;
const WORDMARK = 'grocery';

// Charcoal splash, slow and soft: brand mark fades in → wordmark rises letter by
// letter → tagline → the two shelves glide in and drift. At the end the branding
// fades away while the very same shelves slide up into the Sign in hero's position,
// so the Login screen fades in around them.
export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const sceneRef = useRef(null);
  const measureRef = useRef(null);
  const sceneDy = useSharedValue(0);
  const mark = useSharedValue(0);
  const tagline = useSharedValue(0);
  const progress = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Login'), DURATION);
    // Re-measure right before the glide so the target is the shelves' real resting position,
    // not a stale layout-time value (which made them overshoot toward the top).
    const m = setTimeout(() => measureRef.current?.(), HOLD - 200);
    return () => {
      clearTimeout(t);
      clearTimeout(m);
    };
  }, [navigation]);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    mark.value = withDelay(200, withTiming(1, { duration: 1100, easing: ease }));
    tagline.value = withDelay(2000, withTiming(1, { duration: 900, easing: ease }));
    progress.value = withDelay(200, withTiming(1, { duration: HOLD, easing: Easing.inOut(Easing.cubic) }));
    exit.value = withDelay(HOLD, withTiming(1, { duration: EXIT, easing: Easing.inOut(Easing.cubic) }));
  }, []);

  // How far the shelves must travel from where they rest to where Login draws them.
  const measureScene = () =>
    sceneRef.current?.measureInWindow((_x, y) => {
      sceneDy.value = insets.top + AUTH_SHELF_TOP - y;
    });
  measureRef.current = measureScene;

  const chromeStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, exit.value * 2.2),
    transform: [{ translateY: exit.value * -14 }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [{ scale: 0.75 + mark.value * 0.25 }],
  }));
  const sceneStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: exit.value * sceneDy.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: (1 - tagline.value) * 8 }],
  }));
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <SafeAreaView
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Grocery supermarket admin is loading"
    >
      <View style={styles.fill}>
        <View style={styles.center}>
          <Animated.View style={[styles.brand, chromeStyle]}>
            <Animated.View style={[styles.mark, markStyle]}>
              <Icon name="basket" size={40} color={colors.ink} />
            </Animated.View>

            <View style={styles.wordRow} accessible={false}>
              {WORDMARK.split('').map((ch, i) => (
                <Letter key={i} char={ch} delay={900 + i * 90} />
              ))}
            </View>
            <Animated.Text style={[styles.tagline, taglineStyle]}>Supermarket admin</Animated.Text>
          </Animated.View>

          <View ref={sceneRef} onLayout={measureScene} style={styles.scene}>
            <Animated.View style={sceneStyle}>
              <ShelfScene reveal settle={exit} />
            </Animated.View>
          </View>
        </View>

        <Animated.View style={[styles.progressTrack, chromeStyle]}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function Letter({ char, delay }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [delay]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 56 }],
  }));
  return (
    <View style={styles.letterMask}>
      <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center' },

  mark: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordRow: { flexDirection: 'row', marginTop: 16 },
  letterMask: { overflow: 'hidden', paddingBottom: 6 },
  letter: {
    color: colors.ink,
    fontSize: 52,
    lineHeight: 58,
    fontFamily: fonts.display,
    letterSpacing: -2,
    includeFontPadding: false,
  },
  tagline: { marginTop: 4, color: colors.inkMuted, fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  scene: { alignSelf: 'stretch', marginTop: 32 },

  progressTrack: {
    alignSelf: 'center',
    width: 120,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.inkLine,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
});
