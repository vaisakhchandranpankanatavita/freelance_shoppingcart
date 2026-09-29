import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../theme';

// Neutral frosted canvas for glass cards: soft white and grey light shapes under a heavy blur,
// no colour. The variation behind the blur is what lets the cards read as glass.
// Absolute-fills its parent and ignores touches.
export function GlassBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, { top: '-6%', right: '-22%', width: 300, height: 300, backgroundColor: '#FFFFFF', opacity: 0.9 }]} />
      <View style={[styles.blob, { top: '30%', left: '-30%', width: 280, height: 280, backgroundColor: '#AEB8BD', opacity: 0.5 }]} />
      <View style={[styles.blob, { bottom: '4%', right: '-18%', width: 260, height: 260, backgroundColor: '#9AA6AC', opacity: 0.4 }]} />
      <View style={[styles.blob, { bottom: '-8%', left: '-10%', width: 200, height: 200, backgroundColor: '#FFFFFF', opacity: 0.8 }]} />
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.35)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// Frosted fade over the bottom edge of a scrolling screen: content thins out into neutral frost
// with no visible edge. Web masks the blur itself to a gradient; native (BlurView can't be
// masked) relies on the gradient alone. Ignores touches.
const WEB_MASK = Platform.select({
  web: {
    maskImage: 'linear-gradient(to bottom, transparent, #000 75%)',
    WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 75%)',
  },
  default: null,
});

export function GlassEdge({ height = 110 }) {
  return (
    <View style={[styles.edge, { height }]} pointerEvents="none">
      {WEB_MASK ? <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, WEB_MASK]} /> : null}
      <LinearGradient
        colors={['rgba(238,238,234,0)', 'rgba(238,238,234,0.6)', 'rgba(238,238,234,0.92)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

// Frosted-glass surface: translucent white, its own backdrop blur and a bright hairline edge.
export function GlassCard({ children, style, intensity = 40 }) {
  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.55 },
  card: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
});
