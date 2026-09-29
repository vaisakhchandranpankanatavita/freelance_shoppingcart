import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, fonts, radius, spacing } from '../theme';
import { enter } from '../theme/motion';

// A blank or failed list: say what happened and offer the next step.
// tone 'error' tints the icon red.
export default function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction, tone, index = 0 }) {
  const error = tone === 'error';
  return (
    <Animated.View entering={enter(index)} style={styles.wrap}>
      <View style={[styles.ring, error && styles.ringError]}>
        <Icon name={icon} size={28} color={error ? colors.danger : colors.textMuted} />
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
  },
  ringError: { backgroundColor: `${colors.danger}14`, borderColor: `${colors.danger}33` },
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
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
});
