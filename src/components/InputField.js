import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import { colors, spacing } from '../theme';
import { fadeIn } from '../theme/motion';

export default function InputField({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
  returnKeyType,
  onSubmitEditing,
  error,
  flash = false, // fills the box red for a moment (failed sign-in)
  style,
}) {
  const [hidden, setHidden] = useState(secureTextEntry);
  const focus = useSharedValue(0);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: error || flash
      ? colors.danger
      : interpolateColor(focus.value, [0, 1], ['rgba(10,127,176,0)', colors.accentStrong]),
  }));

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.wrapper, flash && styles.flash, ringStyle]}>
        {icon ? <Icon name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label || placeholder}
          selectionColor={colors.gradient[1]}
          onFocus={() => (focus.value = withTiming(1, { duration: 180 }))}
          onBlur={() => (focus.value = withTiming(0, { duration: 220 }))}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Icon name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        <Animated.Text entering={fadeIn()} style={styles.error}>
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sm,
    marginLeft: spacing.lg,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 20,
    height: 56,
  },
  flash: { backgroundColor: `${colors.danger}55` },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  eye: { padding: spacing.xs },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, marginLeft: spacing.lg },
});
