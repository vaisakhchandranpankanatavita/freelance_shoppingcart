import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme';

const LABELS = { Dashboard: 'Home', Stock: 'Stock', Purchase: 'Purchase', Sale: 'Sales', More: 'More' };

const AnimatedPath = Animated.createAnimatedComponent(Path);

const BAR = 64; // bar height above the safe-area padding
const DEPTH = 36; // how deep the curved dip cuts into the bar
const HALF = 52; // half-width of the dip
const BUBBLE = 52;
const LIFT = 30; // the active icon rises from its resting spot into the bubble
const glide = { damping: 22, stiffness: 130, mass: 1 }; // slower, softer than the app default

// Bar outline with a smooth concave dip centred on `cx` (a bezier "S" in and out).
const outline = (cx, w, h) => {
  'worklet';
  const k = HALF * 0.55;
  return (
    `M0 0 H${cx - HALF} ` +
    `C${cx - HALF + k} 0 ${cx - k} ${DEPTH} ${cx} ${DEPTH} ` +
    `C${cx + k} ${DEPTH} ${cx + HALF - k} 0 ${cx + HALF} 0 ` +
    `H${w} V${h} H0 Z`
  );
};

// One tab: the icon springs up into the bubble when focused; the label fades in beneath it.
function TabItem({ focused, icon, label, onPress, onLongPress, a11yLabel }) {
  const f = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    f.value = withSpring(focused ? 1 : 0, glide);
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -LIFT * f.value }, { scale: 1 + 0.1 * f.value }],
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
        <Icon name={icon} size={24} color={focused ? colors.accent : colors.inkMuted} animate={focused} />
      </Animated.View>
      <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
    </Pressable>
  );
}

// Charcoal bar with a curved dip that glides to the active tab; a bubble in the bar's own colour
// sits in the dip carrying the active (cyan) icon, and the neighbouring bar edge flows around it.
export default function TabBar({ state, descriptors, navigation, icons }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const height = BAR + Math.max(insets.bottom, 10);
  const slot = width / state.routes.length;
  const cx = useSharedValue(0);
  const placed = useSharedValue(0);

  useEffect(() => {
    if (!slot) return;
    const target = state.index * slot + slot / 2;
    // First layout snaps into place; later changes glide.
    cx.value = placed.value ? withSpring(target, glide) : target;
    placed.value = 1;
  }, [state.index, slot]);

  const pathProps = useAnimatedProps(() => ({ d: outline(cx.value, width, height) }));
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cx.value - BUBBLE / 2 }],
  }));

  return (
    <View style={[styles.outer, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width ? (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
            <AnimatedPath animatedProps={pathProps} fill={colors.card} />
          </Svg>
          <Animated.View style={[styles.bubble, bubbleStyle]} pointerEvents="none" />
        </>
      ) : null}
      <View style={styles.row}>
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
  outer: { backgroundColor: colors.bg },
  row: { flexDirection: 'row', height: BAR },
  // Centre sits a little above the dip's floor, so the bubble looks cradled by the curve.
  bubble: {
    position: 'absolute',
    top: DEPTH - BUBBLE - 6,
    left: 0,
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    backgroundColor: colors.card,
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
