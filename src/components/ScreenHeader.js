import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import IconButton from './IconButton';
import Heading from './Heading';
import { colors, spacing } from '../theme';
import { enter } from '../theme/motion';

const Spacer = () => <View style={{ width: 44 }} />;

// Compact: [back] Title [right]. Large: button row, then a big balanced headline.
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
          <View style={styles.flex} />
          {right}
        </View>
        <Heading level="title" entering={enter(0)} style={styles.largeTitle}>
          {title}
        </Heading>
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
  wrapLarge: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
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
  largeTitle: { marginTop: spacing.lg },
  sub: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
});
