import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { colors, radius, shadows, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';

// tone 'light' = plain white card (optionally with a soft grey fade),
// tone 'dark'  = white paper card with a hairline border.
export default function SectionCard({
  title,
  icon,
  right,
  children,
  style,
  tone = 'dark',
  fade = false,
  index = 0,
}) {
  const light = tone === 'light';
  const fg = light ? colors.ink : colors.text;
  return (
    // Shadow lives on this outer view; the inner one clips the gradient fade to the rounded
    // corners. The two can't share a view — `overflow: 'hidden'` would clip the shadow itself.
    <Animated.View entering={enter(index)} style={styles.shadowWrap}>
      <View style={[styles.card, light ? styles.light : styles.dark, style]}>
        {light && fade ? (
          <LinearGradient
            colors={[colors.card, colors.card, colors.cardFade]}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {title || right ? (
          <View style={styles.header}>
            {icon ? (
              <View style={[styles.icon, { backgroundColor: light ? colors.cardAlt : colors.elevated3 }]}>
                <Icon name={icon} size={16} color={fg} />
              </View>
            ) : null}
            <Text style={[styles.title, { color: fg }]} accessibilityRole="header">
              {title}
            </Text>
            {right}
          </View>
        ) : null}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // backgroundColor avoids Android's elevation-on-transparent-view bug (a solid grey box instead
  // of a soft shadow) — see Glass.js's shadowWrap for the full explanation.
  shadowWrap: { borderRadius: radius.lg, marginBottom: spacing.sm, backgroundColor: colors.bg, ...shadows.sm },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  light: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  dark: { backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.line },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  icon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontFamily: fonts.bodyBold, letterSpacing: -0.3 },
});
