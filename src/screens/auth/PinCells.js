import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fonts, spacing } from '../../theme';

const GAP = 12;

// Four till-display digit cells over one hidden input, so the OS keypad,
// paste and autofill all behave like a normal field.
// `error` flashes every cell red (a failed sign-in).
export default function PinCells({ value, onChangeText, length = 4, label = 'Login ID', placeholder, error = false }) {
  const input = useRef(null);
  const [focused, setFocused] = useState(false);
  // Cells get an explicit width from the measured row, so they fill it exactly
  // whatever `flex` resolves to inside the receipt.
  const [rowW, setRowW] = useState(0);
  const cellW = rowW ? (rowW - GAP * (length - 1)) / length : undefined;
  const active = Math.min(value.length, length - 1);

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => input.current?.focus()} style={styles.row} onLayout={(e) => setRowW(e.nativeEvent.layout.width)} accessible={false}>
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const current = focused && i === active;
          return (
            <View key={i} style={[styles.cell, cellW && { width: cellW, flex: 0 }, digit && styles.filled, current && styles.current, error && styles.error]}>
              {digit ? (
                <Animated.Text key={digit + i} entering={FadeIn.duration(120)} style={styles.digit}>
                  {digit}
                </Animated.Text>
              ) : (
                <View style={styles.dash} />
              )}
            </View>
          );
        })}
        <TextInput
          ref={input}
          value={value}
          onChangeText={(v) => onChangeText(v.replace(/\D/g, '').slice(0, length))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={length}
          placeholder={placeholder}
          textContentType="oneTimeCode"
          caretHidden
          accessibilityLabel={`${label}, ${length} digits`}
          style={styles.hidden}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Explicit full width: the receipt paper was shrink-wrapping this block (~2/3 of the row),
  // leaving the cells hugging the left with a gap on the right.
  root: { width: '100%' },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', gap: GAP, width: '100%' },
  cell: {
    flex: 1,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: { backgroundColor: colors.chip },
  current: { borderColor: colors.accentStrong },
  error: { backgroundColor: colors.danger, borderColor: colors.danger },
  digit: { color: colors.ink, fontSize: 28, fontFamily: fonts.display, fontVariant: ['tabular-nums'] },
  dash: { width: 14, height: 2, borderRadius: 1, backgroundColor: colors.textFaint },
  hidden: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
    ...Platform.select({ web: { outlineStyle: 'none', cursor: 'pointer' }, default: {} }),
  },
});
