import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';
import { colors, shadows, spacing } from '../theme';
import { useTabBarClearance } from './TabBar';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const DISC = 36; // rest height, and the width it starts from before morphing open — compact, a thumb-tap target rather than a showpiece
const PILL_W = 60; // width it settles into once the label has room to sit next to center
const jelly = { damping: 10, stiffness: 180, mass: 0.7 };
// Soft, overshooting open so the pill reads as stretching into shape rather than snapping to size.
const morph = { damping: 11, stiffness: 140, mass: 0.9 };
// The wobble a press settles through on release: past neutral, then back, like dough rebounding.
const wobble = { damping: 7, stiffness: 160, mass: 0.6 };
// Fully visible at rest, fading further as the list scrolls so it doesn't fight the content.
const REST_OPACITY = 0.55;
const SCROLLED_OPACITY = 0.22;
const FADE_DISTANCE = 80; // px of scroll over which it reaches SCROLLED_OPACITY

// The persistent AppHeader's blur/fade layer sits above every screen, so a button positioned inside
// a screen can never draw on top of it. A list screen that wants its "+" in the title row renders
// <AddButton inHeader …/>, which registers the action here; AppHeader draws the disc in its right slot.
export const HeaderActionContext = createContext({ setAction: () => {} });

export function HeaderActionProvider({ children }) {
  const [action, setAction] = useState(null);
  const value = React.useMemo(() => ({ action, setAction }), [action]);
  return <HeaderActionContext.Provider value={value}>{children}</HeaderActionContext.Provider>;
}

// Compact pill reading "Add", tinted toward the same deep-plum the floating TabBar is tinted
// with so the two read as one bottom-of-screen surface family. It opens from a small dot into
// the full label on mount — one continuous stretch, width and text riding the same `morphed`
// value — rather than popping in at full size.
// `solid` keeps it fully opaque and fixed (header slot); otherwise it rests semi-transparent so
// it sits lightly over a list and fades further as the list scrolls (pass the list's scroll
// position as `scrollY`, a Reanimated shared value). `style` positions it.
export function AddDisc({ onPress, accessibilityLabel = 'Add', scrollY, solid, style }) {
  const enter = useSharedValue(0);
  const morphed = useSharedValue(0);
  const squeeze = useSharedValue(0);

  React.useEffect(() => {
    enter.value = withDelay(350, withSpring(1, jelly));
    morphed.value = withDelay(430, withSpring(1, morph));
  }, []);

  const pill = useAnimatedStyle(() => {
    const scrollFade = solid
      ? 1
      : scrollY
        ? interpolate(scrollY.value, [0, FADE_DISTANCE], [REST_OPACITY, SCROLLED_OPACITY], Extrapolation.CLAMP)
        : REST_OPACITY;
    // `squeeze` (-0.4…1) rides one continuous axis: pressing in narrows the pill and stretches it
    // tall (positive), releasing carries it through dough rebounding past neutral — wider and
    // flatter (negative) — before the wobble spring settles it back to rest at 0.
    const base = 0.7 + 0.3 * enter.value;
    return {
      width: (DISC + (PILL_W - DISC) * morphed.value) * (1 - 0.06 * squeeze.value),
      opacity: Math.min(scrollFade, enter.value),
      transform: [
        { translateY: (1 - enter.value) * 24 + squeeze.value * 2 },
        { scaleX: base * (1 - 0.1 * squeeze.value) },
        { scaleY: base * (1 + 0.1 * squeeze.value) },
      ],
    };
  });
  const label = useAnimatedStyle(() => ({
    opacity: interpolate(morphed.value, [0.5, 1], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPressIn={() => {
        // Ultra-smooth glide into the squeeze — an eased timing, not a spring, so there's no
        // overshoot on the way in; the bounce only ever happens on release.
        squeeze.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) });
      }}
      onPressOut={() => {
        squeeze.value = withSequence(withSpring(-0.4, wobble), withSpring(0, wobble));
      }}
      onPress={onPress}
      style={[styles.pill, style, pill]}
    >
      <View style={[styles.fill, { borderRadius: DISC / 2, backgroundColor: colors.bar }]}>
        <Animated.Text style={[styles.label, label]} numberOfLines={1}>
          Add
        </Animated.Text>
      </View>
    </AnimatedPressable>
  );
}

// A floating disc in the thumb zone, bottom-right and clear of the tab bar so the two never crowd.
export default function AddButton({ inHeader, ...props }) {
  const focused = useIsFocused();
  const { setAction } = useContext(HeaderActionContext);
  const onPress = useRef(props.onPress);
  onPress.current = props.onPress;
  const label = props.accessibilityLabel;
  // Same safe-area-aware offset BottomBar uses, so the disc's bottom edge always clears the
  // floating tab bar pill instead of the fixed spacing.xl+md guess (which undershoots it on
  // any device with a real bottom inset, since both sit at the same `right` margin as the bar).
  const tabClearance = useTabBarClearance();

  // Only the focused tab owns the header slot (every tab screen stays mounted).
  useEffect(() => {
    if (!inHeader || !focused) return undefined;
    const mine = { onPress: () => onPress.current?.(), accessibilityLabel: label };
    setAction(mine);
    // Clear only our own registration: the next tab may already have claimed the slot.
    return () => setAction((cur) => (cur === mine ? null : cur));
  }, [inHeader, focused, label, setAction]);

  return inHeader ? null : <AddDisc {...props} style={[styles.floating, { bottom: tabClearance }]} />;
}

const styles = StyleSheet.create({
  // Shadow-casting layer: no overflow-hidden here, or it clips the shadow itself (iOS).
  pill: {
    height: DISC,
    borderRadius: DISC / 2, // fixed radius: height never changes, only width morphs
    ...shadows.md,
  },
  floating: { position: 'absolute', right: spacing.lg },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.onAccent, fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
});
