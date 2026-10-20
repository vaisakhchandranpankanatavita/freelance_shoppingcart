import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { enter } from '../theme/motion';

// A blank or failed list: say what happened and offer the next step.
// tone 'error' tints the icon red. tone 'locked' is for a feature whose backend API isn't
// live yet — reads as "unlocks soon" rather than a broken screen (amber, no error framing).
export default function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction, tone, index = 0 }) {
  const error = tone === 'error';
  const locked = tone === 'locked';
  return (
    <Animated.View entering={enter(index)} style={styles.wrap}>
      {locked ? (
        <View style={styles.lockedBadge}>
          <Icon name="sparkles" size={11} color={colors.warningStrong} />
          <Text style={styles.lockedBadgeText}>Coming soon</Text>
        </View>
      ) : null}
      <View style={[styles.ring, error && styles.ringError, locked && styles.ringLocked]}>
        <Icon name={icon} size={28} color={error ? colors.danger : locked ? colors.warningStrong : colors.textMuted} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel ? (
        <PressableScale style={styles.action} onPress={onAction} accessibilityLabel={actionLabel}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  ringError: { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}33` },
  ringLocked: { backgroundColor: `${colors.warning}14`, borderColor: `${colors.warning}33` },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: `${colors.warning}1F`,
    marginBottom: spacing.md,
  },
  lockedBadgeText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.warningStrong, letterSpacing: 0.2 },
  title: {
    marginTop: spacing.lg,
    color: colors.text,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.displayBold,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  action: {
    marginTop: spacing.lg,
    height: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  actionText: { color: colors.onAccent, fontSize: 15, fontFamily: fonts.bodyBold },
});
