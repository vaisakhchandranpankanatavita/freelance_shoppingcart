import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import GlassBlur from './GlassBlur';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radius, shadows, spacing } from '../theme';

const ROW_H = 58;
const GAP = 8;
// Small round expand toggle, overlapping the first row's bottom-right corner instead of a
// full-width strip — collapsed state now shows exactly one item, nothing peeking/blurred below.
const TOGGLE_SIZE = 28;
const ease = { duration: 420, easing: Easing.inOut(Easing.cubic) };

function Card({ children }) {
  // Shadow on this wrapper, clipping (blur + rounded corners) on the inner view —
  // `overflow: 'hidden'` next to Android's `elevation` shadow clips it into a hard line.
  // GlassBlur is a no-op on Android (see that file) — the card's own translucent white
  // `backgroundColor` (styles.card) is what actually reads as "glass" there.
  return (
    <View style={styles.shadowWrap}>
      <View style={styles.card}>
        <GlassBlur intensity={30} tint="light" style={StyleSheet.absoluteFill} />
        {children}
      </View>
    </View>
  );
}

// A plain vertical list of frosted-glass rows. Collapsed shows only the first row; "Show all"
// expands the rest in place (a simple height reveal, no card-deck illusion). `renderItem(item)`
// fills one row.
export default function StackedList({ items, keyExtractor, renderItem, label }) {
  const [open, setOpen] = useState(false);
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(open ? 1 : 0, ease);
  }, [open]);

  const n = items.length;
  // Collapsed shows exactly the first row, nothing else — no peeking/blurred sliver of the next
  // item. Expanded adds every remaining row at full height.
  const collapsedH = ROW_H;
  const expandedH = n * ROW_H + (n - 1) * GAP;
  const boxStyle = useAnimatedStyle(() => ({
    height: interpolate(p.value, [0, 1], [collapsedH, expandedH]),
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.box, boxStyle]}>
        {items.map((item, i) => (
          <View key={keyExtractor(item)} style={[styles.row, i > 0 && { marginTop: GAP }]}>
            <Card>{renderItem(item)}</Card>
          </View>
        ))}
      </Animated.View>

      {n > 1 ? (
        <PressableScale
          onPress={() => setOpen((o) => !o)}
          scaleTo={0.9}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={open ? `Show fewer ${label}` : `Show all ${n} ${label}`}
        >
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // marginBottom reserves the space the toggle pokes into (it's absolutely positioned at
  // `bottom: -TOGGLE_SIZE / 2`, outside this wrap's own laid-out height) — without it, the next
  // sibling below (e.g. a section heading with only a few px of margin-top) starts right under
  // the toggle and visually/touch-wise sits on top of its lower half, so taps there never reach
  // the toggle's onPress. Reserving the full half-height here keeps that area clear.
  wrap: { marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: TOGGLE_SIZE / 2 },
  box: { overflow: 'hidden' },
  row: { height: ROW_H },
  // backgroundColor avoids Android's elevation-on-transparent-view bug (a solid grey box instead
  // of a soft shadow) — see Glass.js's shadowWrap for the full explanation.
  shadowWrap: { height: ROW_H, borderRadius: radius.md, backgroundColor: colors.bg, ...shadows.sm },
  card: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  // Small round button overlapping the first row's bottom-right corner — the only hint that
  // there's more below, replacing the old peeking-blur strip.
  toggle: {
    position: 'absolute',
    right: spacing.sm,
    bottom: -TOGGLE_SIZE / 2,
    width: TOGGLE_SIZE,
    height: TOGGLE_SIZE,
    borderRadius: TOGGLE_SIZE / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    ...shadows.sm,
  },
});
