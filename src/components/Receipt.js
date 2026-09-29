import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { colors, spacing, fonts } from '../theme';

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, Menlo, Consolas, monospace',
});

const TOOTH = 12;

function Edge({ width, flip }) {
  if (!width) return null;
  const n = Math.ceil(width / TOOTH);
  let d = `M0 ${TOOTH / 2}`;
  for (let i = 0; i < n; i++) d += ` L${i * TOOTH + TOOTH / 2} 0 L${(i + 1) * TOOTH} ${TOOTH / 2}`;
  d += ` V${TOOTH / 2 + 1} H0 Z`;
  return (
    <Svg width={width} height={TOOTH / 2 + 1} style={flip && { transform: [{ scaleY: -1 }] }}>
      <Path d={d} fill={colors.paper} />
    </Svg>
  );
}

export function Perforation() {
  const [w, setW] = useState(0);
  return (
    <View style={styles.perf} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w ? (
        <Svg width={w} height={2}>
          <Line x1={0} y1={1} x2={w} y2={1} stroke={colors.line} strokeWidth={1.5} strokeDasharray="5 5" />
        </Svg>
      ) : null}
    </View>
  );
}

// A barcode "printed" from `value`: each character sets four bar widths.
export function Barcode({ value, height = 42 }) {
  const bars = useMemo(() => {
    const src = value && value.length ? value : 'GROCERY';
    const out = [];
    let x = 0;
    for (const ch of `*${src}*`) {
      const code = ch.charCodeAt(0);
      for (let k = 0; k < 4; k++) {
        const w = 1 + ((code >> k) & 1) + ((code >> (k + 4)) & 1);
        if (k % 2 === 0) out.push({ x, w });
        x += w + 1.2;
      }
    }
    return { out, total: x };
  }, [value]);

  // Constant module width so a short ID prints a short code, like a real label.
  return (
    <View style={styles.barcode}>
      <Svg width={Math.min(bars.total * 2.8, 300)} height={height} viewBox={`0 0 ${bars.total} ${height}`} preserveAspectRatio="none">
        {bars.out.map((b, i) => (
          <Rect key={i} x={b.x} y={0} width={b.w} height={height} fill={colors.paperInk} />
        ))}
      </Svg>
    </View>
  );
}

// Till-receipt slip with torn zigzag edges; prints (slides) up into place.
export default function Receipt({ children, style }) {
  const [w, setW] = useState(0);
  return (
    <Animated.View
      entering={FadeInDown.delay(150).springify().damping(18).stiffness(120)}
      style={[styles.wrap, style]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      <Edge width={w} />
      <View style={styles.paper}>{children}</View>
      <Edge width={w} flip />
    </Animated.View>
  );
}

export function ReceiptHeader({ title }) {
  const now = new Date();
  const stamp = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <View style={styles.header}>
      <Text style={styles.store}>{title}</Text>
      <Text style={styles.stamp}>{stamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    shadowColor: '#1D1D23',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  paper: {
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    marginTop: -1,
    marginBottom: -1,
  },
  perf: { height: 2, marginVertical: spacing.lg },
  barcode: { alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  store: { color: colors.paperInk, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },
  stamp: { color: colors.textMuted, fontSize: 11, fontFamily: mono },
});
