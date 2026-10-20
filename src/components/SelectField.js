import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radius, shadows, spacing, fonts } from '../theme';

// Pill-shaped picker that matches InputField: tap to choose from `options`
// ([{ value, label }]) in a bottom sheet. `disabled` greys it out (e.g. a state
// picker before a country is chosen).
export default function SelectField({
  label,
  icon,
  placeholder = 'Select',
  value,
  options = [],
  onChange,
  error,
  disabled = false,
  style,
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <PressableScale
        onPress={() => setOpen(true)}
        disabled={disabled}
        scaleTo={0.98}
        style={[styles.wrapper, error && styles.wrapperError, disabled && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label || placeholder}: ${selected?.label ?? 'not selected'}`}
      >
        {icon ? <Icon name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <Text style={[styles.value, !selected && { color: colors.textFaint }]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      </PressableScale>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.backdropTint} pointerEvents="none" />
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
            onPress={() => {}}
          >
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={<Text style={styles.empty}>Nothing to choose from yet.</Text>}
              renderItem={({ item }) => {
                const on = String(item.value) === String(value);
                return (
                  <PressableScale
                    scaleTo={0.98}
                    style={styles.option}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.optionText, on && styles.optionOn]}>{item.label}</Text>
                    {on ? <Icon name="checkmark" size={18} color={colors.accentStrong} /> : null}
                  </PressableScale>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    marginBottom: 4,
    marginLeft: spacing.xs,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  wrapperError: { borderColor: colors.danger },
  icon: { marginRight: spacing.sm },
  value: { flex: 1, fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.text },
  error: { color: colors.dangerStrong, fontSize: 11, marginTop: 4, marginLeft: spacing.sm },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  backdropTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: {
    backgroundColor: colors.elevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  sheetTitle: { fontSize: 17, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionText: { fontSize: 15, color: colors.text },
  optionOn: { fontFamily: fonts.bodyBold, color: colors.accentStrong },
  empty: { color: colors.textMuted, paddingVertical: spacing.lg, textAlign: 'center' },
});
