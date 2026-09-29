import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import useTween from '../hooks/useTween';
import { colors } from '../theme';
import { spring } from '../theme/motion';

const AXIS = 30;
const PAD_TOP = 34; // headroom for the tooltip bubble
let uid = 0;

// Catmull-Rom → cubic Bézier: a smooth curve that passes through every point.
function smoothPath(p) {
  if (p.length < 2) return '';
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// Area line chart (drawn for a charcoal card): the curve sweeps in left→right, morphs between series, and a
// tooltip springs between points as you tap or drag across the plot.
export default function LineChart({
  series,
  max = 3,
  ticks = [0, 1, 2, 3],
  height = 190,
  format = (v) => `${v.toFixed(1)}K`,
  initialIndex = 2,
}) {
  const ids = useRef(`lc${++uid}`).current;
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(initialIndex);
  const values = useTween(series.points, { duration: 750 });

  const plotW = Math.max(0, width - AXIS);
  const plotH = height - PAD_TOP;
  const pts = useMemo(
    () =>
      values.map((v, i) => ({
        x: (i / (values.length - 1)) * plotW,
        y: PAD_TOP + plotH - (v / max) * plotH,
      })),
    [values, plotW, plotH, max],
  );
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${plotW},${height} L0,${height} Z` : '';

  // Sweep-in reveal of the whole plot.
  const reveal = useSharedValue(0);
  const pop = useSharedValue(0);
  useEffect(() => {
    if (!plotW) return;
    reveal.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
    pop.value = withDelay(900, withSpring(1, spring));
  }, [plotW > 0]);
  const revealStyle = useAnimatedStyle(() => ({ width: reveal.value * plotW }));

  // Tooltip follows the selected point (and the curve while it morphs).
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const target = pts[selected];
  useEffect(() => {
    if (!target) return;
    tx.value = withSpring(target.x, spring);
    ty.value = withSpring(target.y, spring);
  }, [target?.x, target?.y]);
  const tipStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 0.6 + 0.4 * pop.value }],
  }));

  const pick = (x) => {
    if (!plotW) return;
    const n = series.points.length - 1;
    setSelected(Math.max(0, Math.min(n, Math.round((x / plotW) * n))));
  };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
        onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
        onPanResponderTerminationRequest: () => true,
      }),
    [plotW, series.points.length],
  );

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height, flexDirection: 'row' }}>
        <View style={styles.axis}>
          {ticks.map((t) => (
            <Text key={t} style={[styles.axisText, styles.yLabel, { top: PAD_TOP + plotH - (t / max) * plotH - 7 }]}>
              {t ? `${t}K` : '0'}
            </Text>
          ))}
        </View>

        {plotW ? (
          <View style={{ width: plotW, height }} {...responder.panHandlers}>
            <Svg width={plotW} height={height} style={StyleSheet.absoluteFill}>
              {ticks.map((t) => {
                const y = PAD_TOP + plotH - (t / max) * plotH;
                return (
                  <Line key={t} x1={0} x2={plotW} y1={y} y2={y} stroke={colors.inkLine} strokeDasharray="4 5" strokeWidth={1} />
                );
              })}
            </Svg>

            <Animated.View style={[styles.reveal, { height }, revealStyle]}>
              <Svg width={plotW} height={height}>
                <Defs>
                  <LinearGradient id={`${ids}f`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.green} stopOpacity="0.38" />
                    <Stop offset="1" stopColor={colors.green} stopOpacity="0" />
                  </LinearGradient>
                  <LinearGradient id={`${ids}s`} x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={colors.accent} />
                    <Stop offset="1" stopColor={colors.green} />
                  </LinearGradient>
                </Defs>
                <Path d={area} fill={`url(#${ids}f)`} />
                <Path d={line} fill="none" stroke={`url(#${ids}s)`} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </Animated.View>

            <Animated.View pointerEvents="none" style={[styles.tip, tipStyle]}>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{format(values[selected] ?? 0)}</Text>
              </View>
              <View style={styles.caret} />
              <View style={styles.halo}>
                <View style={styles.dot} />
              </View>
            </Animated.View>
          </View>
        ) : null}
      </View>

      <View style={[styles.xAxis, { marginLeft: AXIS }]}>
        {series.labels.map((l) => (
          <Text key={l} style={styles.axisText}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

const TIP_W = 52;
const HALO = 14;

const styles = StyleSheet.create({
  axis: { width: AXIS },
  axisText: { color: colors.inkMuted, fontSize: 11, fontWeight: '600', opacity: 0.7 },
  yLabel: { position: 'absolute', left: 0, lineHeight: 14 },
  reveal: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  // Anchored so the halo's centre sits on (translateX, translateY).
  tip: {
    position: 'absolute',
    left: -TIP_W / 2,
    top: -(26 + 5 + HALO / 2),
    width: TIP_W,
    alignItems: 'center',
  },
  bubble: {
    height: 26,
    minWidth: TIP_W,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.accent,
  },
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: HALO / 2,
    backgroundColor: 'rgba(30,213,138,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
});
