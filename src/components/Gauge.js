import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import useTween from '../hooks/useTween';
import { colors } from '../theme';

const TICKS = 96;
const LABELS = 8;

const polar = (c, r, deg) => {
  const a = (deg * Math.PI) / 180;
  return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
};

function ticksPath(c, rIn, rOut, fromDeg, toDeg) {
  let d = '';
  for (let i = 0; i < TICKS; i++) {
    const deg = (i / TICKS) * 360;
    if (deg < fromDeg || deg > toDeg) continue;
    const a = polar(c, rIn, deg);
    const b = polar(c, rOut, deg);
    d += `M${a.x},${a.y}L${b.x},${b.y}`;
  }
  return d;
}

function arcPath(c, r, deg) {
  const end = polar(c, r, Math.min(deg, 359.9));
  return `M${c},${c - r} A${r},${r} 0 ${deg > 180 ? 1 : 0} 1 ${end.x},${end.y}`;
}

// Radial dial (drawn for a charcoal card): the tick ring lights up clockwise, the thin arc sweeps with it,
// a glowing knob rides the tip and the centre number counts up — all from one tween.
export default function Gauge({ value, max, unit, size = 280, from = colors.danger, to = colors.danger }) {
  const c = size / 2;
  const rRing = c - 12;
  const rTickOut = c - 32;
  const rTickIn = rTickOut - 7;
  const rArc = rTickIn - 8;
  const rLabel = rArc - 20;

  const shown = useTween(value, { duration: 1100, from: 0 });
  const p = Math.max(0, Math.min(1, shown / max));
  const deg = p * 360;
  const tip = polar(c, rArc, deg);

  const allTicks = useMemo(() => ticksPath(c, rTickIn, rTickOut, 0, 360), [c]);
  const labels = useMemo(
    () =>
      Array.from({ length: LABELS }, (_, k) => ({
        text: Math.round((max * k) / LABELS),
        ...polar(c, rLabel, (k / LABELS) * 360),
      })),
    [c, max],
  );

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
    return () => cancelAnimation(pulse);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 0.6 + pulse.value * 1.6 }],
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${Math.round(value)} ${unit} of ${max}`}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={rRing} stroke="#303037" strokeWidth={22} fill="none" />
        <Circle cx={c} cy={c} r={rRing - 11} stroke="#3A3A43" strokeWidth={1} fill="none" />
        <Path d={allTicks} stroke={colors.inkMuted} strokeOpacity={0.3} strokeWidth={1.4} />
        <Path d={ticksPath(c, rTickIn, rTickOut, 0, deg)} stroke={to} strokeWidth={1.6} />
        <Path d={arcPath(c, rArc, deg)} stroke={from} strokeOpacity={0.5} strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Circle cx={tip.x} cy={tip.y} r={10} fill={to} fillOpacity={0.18} />
        <Circle cx={tip.x} cy={tip.y} r={3.5} fill={to} />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[styles.pulse, { left: tip.x - 12, top: tip.y - 12, backgroundColor: to }, pulseStyle]}
      />

      {labels.map((l) => (
        <Text key={l.text} style={[styles.label, { left: l.x - 24, top: l.y - 8 }]}>
          {l.text}
        </Text>
      ))}

      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { color: to }]}>{Math.round(shown)}</Text>
        <Text style={[styles.unit, { color: to }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pulse: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  label: {
    position: 'absolute',
    width: 48,
    textAlign: 'center',
    color: colors.inkMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 64, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginTop: -4 },
});
