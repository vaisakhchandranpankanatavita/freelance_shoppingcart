import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors, radius, spacing } from '../theme';

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
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={[styles.wrapper, error && styles.wrapperError, disabled && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label || placeholder}: ${selected?.label ?? 'not selected'}`}
      >
        {icon ? <Icon name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <Text style={[styles.value, !selected && { color: colors.textFaint }]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              style={{ maxHeight: 360 }}
              ListEmptyComponent={<Text style={styles.empty}>Nothing to choose from yet.</Text>}
              renderItem={({ item }) => {
                const on = String(item.value) === String(value);
                return (
                  <Pressable
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
                  </Pressable>
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
    borderColor: 'transparent',
    borderRadius: 999,
    paddingHorizontal: 20,
    height: 56,
  },
  wrapperError: { borderColor: colors.danger },
  icon: { marginRight: spacing.sm },
  value: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, marginLeft: spacing.lg },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.elevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  optionText: { fontSize: 15, color: colors.text },
  optionOn: { fontWeight: '700', color: colors.accentStrong },
  empty: { color: colors.textMuted, paddingVertical: spacing.lg, textAlign: 'center' },
});
