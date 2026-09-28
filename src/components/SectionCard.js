import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from './Icon';
import { colors, radius, spacing } from '../theme';
import { enter } from '../theme/motion';

// tone 'light' = white paper card (optionally with the reference's soft grey fade),
// tone 'dark'  = graphite card on the black canvas.
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
    <Animated.View
      entering={enter(index)}
      style={[styles.card, light ? styles.light : styles.dark, style]}
    >
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  light: { backgroundColor: colors.card },
  dark: { backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.line },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  icon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
});
