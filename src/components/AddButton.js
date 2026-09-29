import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';
import { pressSpring, spring } from '../theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DISC = 40;
const ARM = 16; // plus arm length
const jelly = { damping: 10, stiffness: 180, mass: 0.7 };

// Floating "+ New" pill in the thumb zone, bottom-right above the tab bar. Charcoal like the
// app's feature cards, with a green → cyan disc holding the plus. It pops in on mount; on press
// the plus turns a quarter. Render it inside <Screen>, beside the list.
export default function AddButton({ onPress, label = 'New', accessibilityLabel = 'Add' }) {
  const enter = useSharedValue(0);
  const turn = useSharedValue(0);
  const press = useSharedValue(1);

  React.useEffect(() => {
    enter.value = withDelay(350, withSpring(1, jelly));
  }, []);

  const pill = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value),
    transform: [{ translateY: (1 - enter.value) * 24 }, { scale: press.value * (0.7 + 0.3 * enter.value) }],
  }));
  const plus = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 90}deg` }] }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPressIn={() => {
        press.value = withSpring(0.93, pressSpring);
      }}
      onPressOut={() => {
        press.value = withSpring(1, jelly);
      }}
      onPress={() => {
        turn.value = withSpring(1, spring, () => {
          turn.value = withDelay(120, withSpring(0, spring));
        });
        onPress?.();
      }}
      style={[styles.pill, pill]}
    >
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.disc}
      >
        <Animated.View style={[styles.plus, plus]}>
          <View style={[styles.h, styles.arm]} />
          <View style={[styles.v, styles.arm]} />
        </Animated.View>
      </LinearGradient>
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl + spacing.md, // clear of the tab bar so the two never crowd
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 6,
    paddingRight: spacing.lg,
    height: DISC + 12,
    borderRadius: 999,
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  disc: {
    width: DISC,
    height: DISC,
    borderRadius: DISC / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.ink, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  plus: { width: ARM, height: ARM, alignItems: 'center', justifyContent: 'center' },
  arm: { position: 'absolute', backgroundColor: colors.onAccent, borderRadius: 2 },
  h: { width: ARM, height: 2.5 },
  v: { width: 2.5, height: ARM },
});
