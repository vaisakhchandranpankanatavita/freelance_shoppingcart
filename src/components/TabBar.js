import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme';
import { spring } from '../theme/motion';

const BAR = 18;

// Flat graphite bar: white icons, the focused one turns cyan and a short cyan
// indicator springs underneath it.
export default function TabBar({ state, descriptors, navigation, icons }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(state.index * slot + (slot - BAR) / 2, spring);
  }, [state.index, slot]);

  const barStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width ? <Animated.View style={[styles.indicator, barStyle]} /> : null}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const { options } = descriptors[route.key];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
            >
              <Icon
                name={focused ? icons[route.name][1] : icons[route.name][0]}
                size={23}
                color={focused ? colors.accent : colors.text}
                animate={focused}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { backgroundColor: colors.bg, paddingHorizontal: 12 },
  bar: { flexDirection: 'row', height: 60 },
  indicator: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    width: BAR,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
