import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { colors, fonts } from '../../theme';

// Four till-display digit cells over one hidden input, so the OS keypad,
// paste and autofill all behave like a normal field.
export default function PinCells({ value, onChangeText, length = 4, label = 'Login ID', placeholder }) {
  const input = useRef(null);
  const [focused, setFocused] = useState(false);
  const active = Math.min(value.length, length - 1);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => input.current?.focus()} style={styles.row} accessible={false}>
        {Array.from({ length }, (_, i) => {
          const digit = value[i];
          const current = focused && i === active;
          return (
            <View key={i} style={[styles.cell, digit && styles.filled, current && styles.current]}>
              {digit ? (
                <Animated.Text key={digit + i} entering={ZoomIn.springify().damping(14)} style={styles.digit}>
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
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 12 },
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
  filled: { backgroundColor: colors.card },
  current: { borderColor: colors.accentStrong },
  digit: { color: colors.ink, fontSize: 28, fontFamily: fonts.display, fontVariant: ['tabular-nums'] },
  dash: { width: 14, height: 2, borderRadius: 1, backgroundColor: colors.textFaint },
  hidden: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
    ...Platform.select({ web: { outlineStyle: 'none', cursor: 'pointer' }, default: {} }),
  },
});
