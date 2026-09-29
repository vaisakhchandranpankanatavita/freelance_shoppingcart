import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import IconButton from './IconButton';
import Heading from './Heading';
import { colors, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';

const Spacer = () => <View style={{ width: 44 }} />;

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
      {leading ?? <Spacer />}
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {right ?? <Spacer />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  wrapLarge: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.xs }, // 44px button row centres the title where the Dashboard's sits
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: colors.text,
  },
  // Same size and font as the Dashboard's "Store Dashboard" title.
  largeTitle: { flex: 1, fontSize: 22, lineHeight: 28, fontFamily: fonts.display, letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
});
