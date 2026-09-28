import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme';
import { spring } from '../theme/motion';

const DOT = 52;

// Floating graphite pill; a white disc springs to the focused tab.
export default function TabBar({ state, descriptors, navigation, icons }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(state.index * slot + (slot - DOT) / 2, spring);
  }, [state.index, slot]);

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 12)}>
        {width ? <Animated.View style={[styles.dot, dotStyle]} /> : null}
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
                size={22}
                color={focused ? colors.ink : colors.textMuted}
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
  outer: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    flexDirection: 'row',
    height: 64,
    padding: 6,
    borderRadius: 999,
    backgroundColor: colors.elevated2,
  },
  dot: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: colors.card,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
