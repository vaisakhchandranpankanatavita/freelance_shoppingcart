import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import PressableScale from './PressableScale';
import GradientBorder from './GradientBorder';
import { colors, typography } from '../theme';

// variant: 'gradient' (outlined, the hero CTA) | 'light' (white pill) | 'dark' (graphite pill)
export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'gradient',
  icon,
  style,
}) {
  const fg = variant === 'light' ? colors.ink : colors.text;
  const content = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={styles.row}>
      {icon ? <Icon name={icon} size={20} color={fg} /> : null}
      <Text style={[typography.button, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[disabled && { opacity: 0.5 }, style]}
    >
      {variant === 'gradient' ? (
        <GradientBorder width={2} innerStyle={styles.btn}>
          {content}
        </GradientBorder>
      ) : (
        <View
          style={[
            styles.btn,
            { backgroundColor: variant === 'light' ? colors.card : colors.elevated2 },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
