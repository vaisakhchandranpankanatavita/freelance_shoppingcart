import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from './Icon';
import { colors } from '../theme';
import { spring } from '../theme/motion';

// Borderless tabs with a cyan outlined thumb that springs between options.
// tone: 'light' (on the light canvas) or 'dark' (inside a charcoal card).
// options: [{ key, label, icon? }]; `compact` for inline toggles (Month / Year).
// `underline`: swaps the boxed thumb for a thin bottom underline under the active label only
// (same indicator language as the dashboard's Quick actions picker), for a lighter-weight tab row.
export default function SegmentedControl({ options, value, onChange, style, compact = false, tone = 'light', underline = false }) {
  const onDark = tone === 'dark';
  const accent = onDark ? colors.accent : colors.accentStrong;
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const segment = width ? width / options.length : 0;
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
      {segment && !underline ? (
        <Animated.View
          style={[styles.thumb, compact && styles.thumbCompact, { width: segment, borderColor: accent }, thumbStyle]}
        />
      ) : null}
      {segment && underline ? (
        <Animated.View style={[styles.underlineThumb, { width: segment, backgroundColor: accent }, thumbStyle]} />
      ) : null}
      {options.map((o) => {
        const active = o.key === value;
        const fg = active ? accent : onDark ? colors.ink : colors.text;
        return (
          <Pressable
            key={o.key}
            style={[styles.item, (compact || underline) && styles.itemCompact]}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
          >
            {o.icon ? <Icon name={o.icon} size={16} color={fg} /> : null}
            <Text style={[styles.text, (compact || underline) && styles.textCompact, { color: fg }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row' },
  thumb: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  thumbCompact: { borderRadius: 6, borderWidth: 1 },
  underlineThumb: { position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 1 },
  item: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  itemCompact: { height: 30 },
  text: { fontSize: 14, fontWeight: '600', letterSpacing: -0.1, flexShrink: 1, minWidth: 0 },
  textCompact: { fontSize: 13 },
});
