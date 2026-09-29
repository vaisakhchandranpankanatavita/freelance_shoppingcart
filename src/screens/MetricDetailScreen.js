import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  ZoomIn,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Screen from '../components/Screen';
import ScreenHeader from '../components/ScreenHeader';
import Gauge from '../components/Gauge';
import SegmentedControl from '../components/SegmentedControl';
import { colors, spacing, tones } from '../theme';
import { enter } from '../theme/motion';
import { branches, metricDetail, metrics, periods } from '../data/dashboardData';

// Gauge detail for one dashboard metric: swipe the branch names to move the dial.
export default function MetricDetailScreen({ navigation, route }) {
  const metric = metrics.find((m) => m.key === route.params?.key) ?? metrics[0];
  const detail = metricDetail[metric.key];
  const [from, to] = tones[metric.tone];

  const [width, setWidth] = useState(0);
  const [branch, setBranch] = useState(0);
  const [period, setPeriod] = useState(periods[0]);
  const item = width * 0.5;
  const gauge = Math.min(width - spacing.lg * 2 - spacing.md * 2, 320);

  const pager = useRef(null);
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
    if (item > 0) {
      const i = Math.round(e.contentOffset.x / item);
      if (i !== branch) runOnJS(setBranch)(Math.max(0, Math.min(branches.length - 1, i)));
    }
  }, [item, branch]);

  const goTo = (i) => pager.current?.scrollTo({ x: i * item, animated: true });

  return (
    <Screen>
      <ScreenHeader title={metric.title} onBack={() => navigation.goBack()} />

      <View style={styles.body} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width ? (
          <>
            <Animated.View entering={enter(0)}>
              <Animated.ScrollView
                ref={pager}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={item}
                decelerationRate="fast"
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingHorizontal: (width - item) / 2 }}
              >
                {branches.map((b, i) => (
                  <PagerTitle key={b} label={b} index={i} x={x} item={item} onPress={() => goTo(i)} />
                ))}
              </Animated.ScrollView>
              <View style={styles.dots}>
                {branches.map((b, i) => (
                  <Dot key={b} index={i} x={x} item={item} />
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={ZoomIn.springify().damping(16).stiffness(120)} style={styles.gauge}>
              <View style={styles.gaugeCard}>
                <Gauge
                  value={detail.values[period][branch]}
                  max={detail.max}
                  unit={detail.unit}
                  size={gauge}
                  from={from}
                  to={to}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(250).duration(400)} style={styles.periods}>
              <SegmentedControl
                compact
                options={periods.map((p) => ({ key: p, label: p }))}
                value={period}
                onChange={setPeriod}
              />
            </Animated.View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

// Centre title is full size; neighbours peek in smaller and faded.
function PagerTitle({ label, index, x, item, onPress }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(x.value / item - index);
    return {
      opacity: interpolate(d, [0, 1], [1, 0.3], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(d, [0, 1], [1, 0.72], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Pressable onPress={onPress} style={{ width: item }} accessibilityRole="button" accessibilityLabel={label}>
      <Animated.Text style={[styles.pagerTitle, style]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function Dot({ index, x, item }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(x.value / item - index);
    return {
      opacity: interpolate(d, [0, 1], [1, 0.25], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(d, [0, 1], [1, 0.6], Extrapolation.CLAMP) }],
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingTop: spacing.lg },
  pagerTitle: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.4, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accentStrong },
  gauge: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gaugeCard: { padding: spacing.md, borderRadius: 32, backgroundColor: colors.card },
  periods: { width: 260, alignSelf: 'center', marginBottom: spacing.xxl },
});
