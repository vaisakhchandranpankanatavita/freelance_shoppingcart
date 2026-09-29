import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme';
import { spring } from '../theme/motion';

const LABELS = { Dashboard: 'Home', Stock: 'Stock', Purchase: 'Purchase', Sale: 'Sales', More: 'More' };

const BUBBLE = 54;
const RING = 5; // bubble border in the page colour: reads as a notch cut into the bar
const LIFT = 22; // how far the active icon rises out of the bar

// One tab: the icon springs up into the bubble when focused; the label fades in beneath it.
function TabItem({ focused, icon, label, onPress, onLongPress, a11yLabel }) {
  const f = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    f.value = withSpring(focused ? 1 : 0, spring);
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LIFT * f.value }, { scale: 1 + 0.08 * f.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: f.value,
    transform: [{ translateY: (1 - f.value) * 6 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={a11yLabel}
    >
      <Animated.View style={iconStyle}>
        <Icon
          name={icon}
          size={24}
          color={focused ? colors.onAccent : colors.inkMuted}
          animate={focused}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
    </Pressable>
  );
}

// Charcoal bar with a cyan bubble that slides (springs) to the active tab; the active icon
// rises into the bubble, and its label fades in underneath.
export default function TabBar({ state, descriptors, navigation, icons }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / state.routes.length;
  const x = useSharedValue(0);
  const seen = useSharedValue(0);

  useEffect(() => {
    if (!slot) return;
    const target = state.index * slot + (slot - BUBBLE) / 2;
    // First layout snaps into place; later changes spring.
    x.value = seen.value ? withSpring(target, spring) : target;
    seen.value = 1;
  }, [state.index, slot]);

  const bubbleStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width ? <Animated.View style={[styles.bubble, bubbleStyle]} pointerEvents="none" /> : null}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          return (
            <TabItem
              key={route.key}
              focused={focused}
              icon={focused ? icons[route.name][1] : icons[route.name][0]}
              label={LABELS[route.name] ?? route.name}
              a11yLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { backgroundColor: colors.card, paddingHorizontal: 12 },
  bar: { flexDirection: 'row', height: 64 },
  bubble: {
    position: 'absolute',
    top: -(BUBBLE / 2 + 2),
    left: 0,
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: colors.accent,
    borderWidth: RING,
    borderColor: colors.bg,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  label: {
    position: 'absolute',
    bottom: 8,
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
