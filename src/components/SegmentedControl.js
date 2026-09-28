import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from './Icon';
import { colors } from '../theme';
import { spring } from '../theme/motion';

const PAD = 4;

// Pill tabs with a white thumb that springs between options.
// options: [{ key, label, icon? }]
export default function SegmentedControl({ options, value, onChange, style }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const segment = width ? (width - PAD * 2) / options.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(index * segment, spring);
  }, [index, segment]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      style={[styles.track, style]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {segment ? <Animated.View style={[styles.thumb, { width: segment }, thumbStyle]} /> : null}
      {options.map((o) => {
        const active = o.key === value;
        const fg = active ? colors.ink : colors.textMuted;
        return (
          <Pressable
            key={o.key}
            style={styles.item}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            {o.icon ? <Icon name={o.icon} size={16} color={fg} /> : null}
            <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.elevated2,
    borderRadius: 999,
    padding: PAD,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: 999,
    backgroundColor: colors.card,
  },
  item: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  text: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
});
