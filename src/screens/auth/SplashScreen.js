import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../../theme';
import { spring } from '../../theme/motion';

const DURATION = 2200;
const EXIT = 420;
const WORDMARK = 'grocery';
const STAGE = 260; // square that holds the glow, rings and mark
const MARK = 96;
const ORBIT = 176;
const [G1, G2, G3] = colors.gradient;

// One orchestrated sequence: glow blooms → rings settle → mark lands → light sweeps
// across it → wordmark rises letter by letter → tagline → progress line completes.
export default function SplashScreen({ navigation }) {
  const reduceMotion = useReducedMotion();

  const glow = useSharedValue(0);
  const breathe = useSharedValue(1);
  const rings = useSharedValue(0);
  const mark = useSharedValue(0);
  const spin = useSharedValue(0);
  const sweep = useSharedValue(0);
  const tagline = useSharedValue(0);
  const progress = useSharedValue(0);

  const exit = useSharedValue(0);

  // Hand-off: the stage pushes toward the camera and dissolves to black, then the
  // Login screen (black too) fades in underneath — no hard cut between them.
  useEffect(() => {
    exit.value = withDelay(
      DURATION - EXIT,
      withTiming(1, { duration: EXIT, easing: Easing.in(Easing.cubic) })
    );
    const t = setTimeout(() => navigation.replace('Login'), DURATION);
    return () => clearTimeout(t);
  }, [navigation]);

  const exitStyle = useAnimatedStyle(() => ({
    opacity: 1 - exit.value,
    transform: [{ scale: 1 + exit.value * 0.18 }],
  }));

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    glow.value = withTiming(1, { duration: 900, easing: ease });
    rings.value = withDelay(120, withTiming(1, { duration: 900, easing: ease }));
    mark.value = withDelay(260, withSpring(1, spring));
    sweep.value = withDelay(820, withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }));
    tagline.value = withDelay(1150, withTiming(1, { duration: 500, easing: ease }));
    progress.value = withDelay(200, withTiming(1, { duration: DURATION - 300, easing: Easing.inOut(Easing.cubic) }));
    if (!reduceMotion) {
      spin.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1, false);
      breathe.value = withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(1.08, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        )
      );
    }
  }, [reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.75,
    transform: [{ scale: (0.6 + glow.value * 0.4) * breathe.value }],
  }));
  const outerRingStyle = useAnimatedStyle(() => ({
    opacity: rings.value * 0.9,
    transform: [{ scale: 1.25 - rings.value * 0.25 }],
  }));
  const innerRingStyle = useAnimatedStyle(() => ({
    opacity: rings.value,
    transform: [{ scale: 0.8 + rings.value * 0.2 }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    opacity: rings.value,
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  const markStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, mark.value * 1.4),
    transform: [{ scale: 0.55 + mark.value * 0.45 }],
  }));
  const sweepStyle = useAnimatedStyle(() => ({
    opacity: sweep.value > 0 && sweep.value < 1 ? 1 : 0,
    transform: [{ translateX: -MARK + sweep.value * MARK * 2 }, { rotate: '20deg' }],
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
      <Animated.View style={[styles.fill, exitStyle]}>
      <View style={styles.center}>
        <View style={styles.stage}>
          {/* Gradient bloom */}
          <Animated.View style={[StyleSheet.absoluteFill, glowStyle]} pointerEvents="none">
            <Svg width={STAGE} height={STAGE}>
              <Defs>
                <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={G2} stopOpacity="0.55" />
                  <Stop offset="45%" stopColor={G1} stopOpacity="0.28" />
                  <Stop offset="100%" stopColor={G1} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={STAGE / 2} cy={STAGE / 2} r={STAGE / 2} fill="url(#bloom)" />
            </Svg>
          </Animated.View>

          {/* Hairline guide rings */}
          <Animated.View style={[styles.ring, styles.outerRing, outerRingStyle]} pointerEvents="none" />
          <Animated.View style={[styles.ring, styles.innerRing, innerRingStyle]} pointerEvents="none" />

          {/* Rotating gradient orbit with a travelling spark */}
          <Animated.View style={[styles.orbit, orbitStyle]} pointerEvents="none">
            <Svg width={ORBIT} height={ORBIT}>
              <Defs>
                <SvgLinearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor={G1} />
                  <Stop offset="55%" stopColor={G2} />
                  <Stop offset="100%" stopColor={G3} />
                </SvgLinearGradient>
              </Defs>
              <Circle
                cx={ORBIT / 2}
                cy={ORBIT / 2}
                r={ORBIT / 2 - 3}
                stroke="url(#arc)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={`${Math.PI * (ORBIT - 6) * 0.62} ${Math.PI * (ORBIT - 6)}`}
                fill="none"
              />
              <Circle cx={ORBIT / 2} cy={3} r={4} fill={G3} />
            </Svg>
          </Animated.View>

          {/* Brand mark with one-shot light sweep */}
          <Animated.View style={[styles.mark, markStyle]}>
            <Icon name="basket" size={44} color={colors.ink} />
            <Animated.View style={[styles.sweep, sweepStyle]} pointerEvents="none">
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Masked, letter-by-letter wordmark */}
        <View style={styles.wordRow} accessible={false}>
          {WORDMARK.split('').map((ch, i) => (
            <Letter key={i} char={ch} delay={700 + i * 55} />
          ))}
        </View>

        <Animated.Text
          style={[styles.tagline, taglineStyle]}
          numberOfLines={2}
          textBreakStrategy="balanced"
        >
          Supermarket admin
        </Animated.Text>
      </View>

      <View style={styles.progressTrack}>
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
    </SafeAreaView>
  );
}

function Letter({ char, delay }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withSpring(1, { damping: 16, stiffness: 180 }));
  }, [delay]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.5),
    transform: [{ translateY: (1 - p.value) * 56 }],
  }));
  return (
    <View style={styles.letterMask}>
      <Animated.Text style={[styles.letter, style]}>{char}</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  stage: { width: STAGE, height: STAGE, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, borderColor: '#2E2E32' },
  outerRing: { width: STAGE - 8, height: STAGE - 8 },
  innerRing: { width: ORBIT + 36, height: ORBIT + 36, borderColor: '#242428' },
  orbit: { position: 'absolute', width: ORBIT, height: ORBIT },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: MARK / 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: `0 0 48px ${G2}55` },
      default: { shadowColor: G2, shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
    }),
  },
  sweep: { position: 'absolute', top: -MARK / 2, width: MARK * 0.45, height: MARK * 2 },

  wordRow: { flexDirection: 'row', marginTop: 20 },
  letterMask: { overflow: 'hidden', paddingBottom: 6 },
  letter: {
    color: colors.text,
    fontSize: 56,
    lineHeight: 62,
    fontFamily: fonts.display,
    letterSpacing: -2.4,
    includeFontPadding: false,
  },
  tagline: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  progressTrack: {
    alignSelf: 'center',
    width: 120,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressFill: { height: '100%', borderRadius: 999, overflow: 'hidden' },
});
