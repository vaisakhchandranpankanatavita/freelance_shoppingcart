import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import PressableScale from './PressableScale';
import GradientBorder from './GradientBorder';
import { colors } from '../theme';

const VARIANTS = {
  dark: { bg: colors.elevated2, fg: colors.text },
  light: { bg: colors.accent, fg: colors.onAccent },
  ink: { bg: colors.chip, fg: colors.ink },
  soft: { bg: colors.cardAlt, fg: colors.ink },
};

export default function IconButton({
  icon,
  onPress,
  variant = 'dark',
  size = 44,
  iconSize,
  badge,
  accessibilityLabel,
  style,
  disabled,
}) {
  const v = VARIANTS[variant];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.9}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={[
        styles.btn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: v.bg },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.46)} color={v.fg} />
      {badge ? (
        <View style={styles.badgeWrap} pointerEvents="none">
          <GradientBorder width={1.5} innerStyle={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </GradientBorder>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { position: 'absolute', top: -4, left: -6 },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: '800' },
});
