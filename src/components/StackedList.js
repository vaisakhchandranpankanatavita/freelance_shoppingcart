import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import { colors, radius, spacing } from '../theme';

const ROW_H = 58;
const GAP = 8;
const PEEK = 12; // how much of each card behind the top one shows
const VISIBLE_BEHIND = 2; // cards past this many hide completely behind the stack
const ease = { duration: 560, easing: Easing.inOut(Easing.cubic) };

// One card: shuffled behind the top one when collapsed (offset, shrunk, slightly turned), and
// gliding to its own slot in the list when expanded.
function Card({ index, count, p, children }) {
  const back = Math.min(index, VISIBLE_BEHIND);
  const turn = (index % 2 ? 1 : -1) * back * 1.4; // degrees
  const slide = (index % 2 ? 1 : -1) * back * 3; // px
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.4, 1], [index > VISIBLE_BEHIND ? 0 : 1, 1, 1]),
    transform: [
      { translateY: interpolate(p.value, [0, 1], [back * PEEK, index * (ROW_H + GAP)]) },
      { translateX: interpolate(p.value, [0, 1], [slide, 0]) },
      { scale: interpolate(p.value, [0, 1], [1 - back * 0.05, 1]) },
      { rotate: `${interpolate(p.value, [0, 1], [turn, 0])}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.card, { zIndex: count - index }, style]}>{children}</Animated.View>
  );
}

// A list drawn as a shuffled stack of cards. Tapping the stack fans every card out into the
// full list; "Show less" folds it back. `renderItem(item)` fills one card.
export default function StackedList({ items, keyExtractor, renderItem, label }) {
  const [open, setOpen] = useState(false);
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(open ? 1 : 0, ease);
  }, [open]);

  const n = items.length;
  const collapsedH = ROW_H + Math.min(n - 1, VISIBLE_BEHIND) * PEEK;
  const expandedH = n * ROW_H + (n - 1) * GAP;
  const boxStyle = useAnimatedStyle(() => ({ height: interpolate(p.value, [0, 1], [collapsedH, expandedH]) }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.box, boxStyle]}>
        {items.map((item, i) => (
          <Card key={keyExtractor(item)} index={i} count={n} p={p}>
            {renderItem(item)}
          </Card>
        ))}
        {!open && n > 1 ? (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: n + 1 }]}
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Show all ${n} ${label}`}
          />
        ) : null}
      </Animated.View>

      {n > 1 ? (
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={styles.toggle}
          accessibilityRole="button"
          accessibilityLabel={open ? `Show fewer ${label}` : `Show all ${n} ${label}`}
        >
          <Text style={styles.hint}>
            {open ? 'Show less' : `Tap to see all ${n}`}
          </Text>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
  box: { position: 'relative' },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.md,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  toggle: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
  hint: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
});
