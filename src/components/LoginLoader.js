import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AuthHero, { AUTH_SHELF_TOP } from '../screens/auth/AuthHero';
import { SHELF_ITEMS, ShelfItem, shelfFit } from '../screens/auth/ShelfScene';
import { colors } from '../theme';
import { fadeOut } from '../theme/motion';

const MERGE = 1600; // products lift off the shelves and gather into the ring
const REV = 1300; // one fast, smooth revolution of the ring
const RADIUS = 64;
const END_SCALE = 0.36; // how small each product ends up in the ring
const N = SHELF_ITEMS.length;

const smooth = (x) => {
  'worklet';
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

// One product from the shelf: starts exactly where Sign in draws it, then glides to its slot on
// a ring around the screen centre. The slot keeps orbiting (`spin`), so the products chase it
// and end up rotating quickly and smoothly as one wheel.
function Bead({ item, size, from, centre, angle, rank, p, spin }) {
  const [, , w, h] = item.box;
  const style = useAnimatedStyle(() => {
    const e = smooth((p.value - 0.04 - rank * 0.012) / 0.6);
    const a = angle + spin.value * 2 * Math.PI;
    const toX = centre.x + RADIUS * Math.cos(a);
    const toY = centre.y + RADIUS * Math.sin(a);
    return {
      transform: [
        { translateX: from.x + (toX - from.x) * e - (w * size) / 2 },
        { translateY: from.y + (toY - from.y) * e - Math.sin(Math.PI * e) * 30 - (h * size) / 2 },
        { rotate: `${(a + Math.PI / 2) * e}rad` },
        { scale: 1 - (1 - END_SCALE) * e },
      ],
    };
  });
  return (
    <Animated.View style={[styles.bead, { width: w * size, height: h * size }, style]}>
      <ShelfItem item={item} scale={size} />
    </Animated.View>
  );
}

// Post-login loader that continues the Sign in hero on the same charcoal: the title and empty
// shelves fade, every product lifts off separately and gathers into a ring around the screen
// centre, and the ring spins as the loading indicator. No text.
export default function LoginLoader() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const p = useSharedValue(0); // gather progress 0→1
  const spin = useSharedValue(0); // ring revolutions

  const centre = useMemo(() => ({ x: width / 2, y: height / 2 }), [width, height]);

  // Each product's start (as Sign in draws it) and slot on the ring, ordered by where it starts
  // so the paths fan out rather than cross; nearest products leave first.
  const beads = useMemo(() => {
    const { s, tx, ty } = shelfFit(width);
    const top = insets.top + AUTH_SHELF_TOP;
    const list = SHELF_ITEMS.map((item, i) => {
      const [x, y, w, h] = item.box;
      const from = { x: tx + (x + w / 2) * s, y: top + ty + (y + h / 2) * s };
      return {
        item,
        i,
        from,
        size: s,
        ang: Math.atan2(from.y - centre.y, from.x - centre.x),
        dist: Math.hypot(from.x - centre.x, from.y - centre.y),
      };
    });
    [...list].sort((a, b) => a.dist - b.dist).forEach((b, r) => (b.rank = r));
    [...list]
      .sort((a, b) => a.ang - b.ang)
      .forEach((b, k) => (b.angle = -Math.PI + (2 * Math.PI * (k + 0.5)) / N));
    return list;
  }, [centre, width, insets.top]);

  useEffect(() => {
    p.value = withTiming(1, { duration: MERGE, easing: Easing.linear });
    spin.value = withRepeat(withTiming(1, { duration: REV, easing: Easing.linear }), -1);
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: 1 - smooth((p.value - 0.04) / 0.4),
    transform: [{ translateY: -smooth((p.value - 0.04) / 0.4) * 12 }],
  }));

  return (
    <Animated.View
      exiting={fadeOut}
      style={styles.fill}
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

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {beads.map((b) => (
          <Bead
            key={b.i}
            item={b.item}
            size={b.size}
            from={b.from}
            centre={centre}
            angle={b.angle}
            rank={b.rank}
            p={p}
            spin={spin}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Same charcoal as the Sign in hero, so the hand-off is one continuous surface.
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.card },
  hero: { position: 'absolute', top: 0, left: 0, right: 0 },
  bead: { position: 'absolute', top: 0, left: 0 },
});
