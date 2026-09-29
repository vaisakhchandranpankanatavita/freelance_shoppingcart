import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import Waveform from './Waveform';
import { colors, radius, tones } from '../theme';

// One card of the dashboard carousel. As it scrolls off to the left it shrinks
// and dims (driven by the carousel's UI-thread scroll offset).
export default function MetricCard({ metric, index, scrollX, interval, width, onPress }) {
  const [from, to] = tones[metric.tone];

  const style = useAnimatedStyle(() => {
    const pos = index * interval;
    // Full size while in view or to the right; shrinks/dims once scrolled past.
    const range = [pos, pos + interval];
    return {
      opacity: interpolate(scrollX.value, range, [1, 0.25], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(scrollX.value, range, [1, 0.86], Extrapolation.CLAMP) },
        { translateX: interpolate(scrollX.value, range, [0, interval * 0.18], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ width }, style]}>
      <PressableScale
        style={styles.card}
        onPress={onPress}
        accessibilityLabel={`${metric.title}: ${metric.value} ${metric.unit}. Open details`}
      >
        <View style={styles.top}>
          <Text style={styles.value}>
            {metric.value.toLocaleString('en-IN')} <Text style={styles.unit}>{metric.unit}</Text>
          </Text>
          <View style={[styles.badge, { borderColor: to }]}>
            {metric.badge ? (
              <Text style={[styles.badgeText, { color: to }]}>{metric.badge}</Text>
            ) : (
              <Icon name={metric.icon} size={15} color={to} />
            )}
          </View>
        </View>
        <Waveform from={from} to={to} seed={index + 1} height={30} style={styles.wave} />
        <Text style={styles.title} numberOfLines={1}>
          {metric.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {metric.subtitle}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  unit: { color: colors.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '800' },
  wave: { marginTop: 10, marginBottom: 12, marginHorizontal: 4 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
});
