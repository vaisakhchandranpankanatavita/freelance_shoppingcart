import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassBlur from './GlassBlur';
import IconButton from './IconButton';
import Heading from './Heading';
import { colors, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';

const Spacer = () => <View style={{ width: 44 }} />;

// Rendered height of each variant — the header now floats over scrolling content (see Screen.js)
// instead of pushing it down, so screens need this to pad their own scroll content to start
// just below it (content still passes underneath, blurred, once the user actually scrolls).
export const HEADER_HEIGHT = (spacing.lg + spacing.sm) * 2 + 44; // compact: back/spacer row is always 44 tall
export const HEADER_HEIGHT_LARGE = (spacing.md + spacing.sm) * 2 + 44; // large + a leading back button
export const HEADER_HEIGHT_LARGE_NO_BACK = (spacing.md + spacing.sm) * 2 + 28; // large, title-only row (no back button)

// Frosted glass. BlurView can't be alpha-masked on native (same limitation noted on Glass.js's
// GlassEdge), so a full-height blur under a fading tint would still cut off sharply the instant
// you cross the view's bottom edge — blurred content one pixel, crisp the next. Instead the blur
// itself only covers the top ~60%, and by the time it ends the tint (which does fade smoothly,
// as a plain gradient) has already dropped to a low, camouflaging opacity; the last ~40% is tint
// only, fading the rest of the way to fully transparent — so the blur's hard edge lands
// somewhere already faint instead of at full visibility, and it reads as one continuous dissolve.
const BLUR_STOP = 0.6;
export const HeaderFade = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <View style={[StyleSheet.absoluteFill, { bottom: `${(1 - BLUR_STOP) * 100}%` }]}>
      <GlassBlur intensity={36} tint="light" style={StyleSheet.absoluteFill} />
    </View>
    <LinearGradient
      colors={[`${colors.bg}E6`, `${colors.bg}B3`, `${colors.bg}4D`, `${colors.bg}00`]}
      locations={[0, BLUR_STOP * 0.7, BLUR_STOP, 1]}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

// Compact: [back] Title [right] (centred title). Large: [back] Title [right] on one row with the
// title left-aligned in the Dashboard's header style, optional subtitle underneath.
export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backIcon = 'arrow-back',
  left,
  right,
  large = false,
}) {
  const leading =
    left ??
    (onBack ? (
      <IconButton icon={backIcon} onPress={onBack} accessibilityLabel="Go back" />
    ) : null);

  if (large) {
    return (
      <View style={styles.wrapLarge}>
        <HeaderFade />
        <View style={styles.row}>
          {leading}
          <Heading level="title" entering={enter(0)} style={styles.largeTitle} numberOfLines={1}>
            {title}
          </Heading>
          {right}
        </View>
        {subtitle ? (
          <Heading level="small" entering={enter(1)} style={styles.sub} accessibilityRole="text">
            {subtitle}
          </Heading>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.wrap]}>
      <HeaderFade />
      {leading ?? <Spacer />}
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {right ?? <Spacer />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg + spacing.sm },
  wrapLarge: { paddingHorizontal: spacing.lg, paddingTop: spacing.md + spacing.sm, paddingBottom: spacing.md + spacing.sm }, // a touch taller than the compact row, title still centred like the Dashboard's
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
    color: colors.text,
  },
  // Same size and font as the Dashboard's "Store Dashboard" title.
  largeTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
});
