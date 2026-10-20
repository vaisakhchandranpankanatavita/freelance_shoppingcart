import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, radius, shadows, spacing, fonts } from '../theme';
import { shortDate } from '../utils/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const buildGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

// Pill-shaped date picker matching SelectField's look: tap to open a bottom-sheet calendar.
// Stores/returns the value as an ISO 'YYYY-MM-DD' string, which the API's `date` validation
// (confirmed by a live 422: "The bill date must be a valid date") accepts unambiguously.
export default function DateField({ label, icon = 'calendar-outline', placeholder = 'Select date', value, onChange, error, disabled = false, style }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  // 'days' shows the calendar grid; 'yearMonth' swaps it for a year stepper + month grid, so a
  // date far from today (e.g. a different year) doesn't need dozens of taps on the arrows.
  const [mode, setMode] = useState('days');
  const parsed = value ? new Date(`${value}T00:00:00`) : null;
  const valid = parsed && !Number.isNaN(parsed.getTime());
  const today = new Date();
  const [cursor, setCursor] = useState(() => ({
    year: valid ? parsed.getFullYear() : today.getFullYear(),
    month: valid ? parsed.getMonth() : today.getMonth(),
  }));

  const open_ = () => {
    setCursor({
      year: valid ? parsed.getFullYear() : today.getFullYear(),
      month: valid ? parsed.getMonth() : today.getMonth(),
    });
    setMode('days');
    setOpen(true);
  };

  const shiftMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const shiftYear = (delta) => setCursor((c) => ({ ...c, year: c.year + delta }));

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <PressableScale
        onPress={open_}
        disabled={disabled}
        scaleTo={0.98}
        style={[styles.wrapper, error && styles.wrapperError, disabled && { opacity: 0.5 }]}
        accessibilityRole="button"
        accessibilityLabel={`${label || placeholder}: ${valid ? shortDate(value) : 'not selected'}`}
      >
        {icon ? <Icon name={icon} size={18} color={colors.textMuted} style={styles.icon} /> : null}
        <Text style={[styles.value, !valid && { color: colors.textFaint }]} numberOfLines={1}>
          {valid ? shortDate(value) : placeholder}
        </Text>
        <Icon name="chevron-forward" size={18} color={colors.textFaint} />
      </PressableScale>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.backdropTint} pointerEvents="none" />
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            {mode === 'days' ? (
              <View style={styles.monthRow}>
                <PressableScale onPress={() => shiftMonth(-1)} style={styles.monthNav} accessibilityLabel="Previous month">
                  <Icon name="chevron-back" size={18} color={colors.text} />
                </PressableScale>
                <PressableScale onPress={() => setMode('yearMonth')} accessibilityLabel="Choose month and year">
                  <Text style={styles.monthLabel}>{monthLabel}</Text>
                </PressableScale>
                <PressableScale onPress={() => shiftMonth(1)} style={styles.monthNav} accessibilityLabel="Next month">
                  <Icon name="chevron-forward" size={18} color={colors.text} />
                </PressableScale>
              </View>
            ) : (
              <View style={styles.monthRow}>
                <PressableScale onPress={() => shiftYear(-1)} style={styles.monthNav} accessibilityLabel="Previous year">
                  <Icon name="chevron-back" size={18} color={colors.text} />
                </PressableScale>
                <Text style={styles.monthLabel}>{cursor.year}</Text>
                <PressableScale onPress={() => shiftYear(1)} style={styles.monthNav} accessibilityLabel="Next year">
                  <Icon name="chevron-forward" size={18} color={colors.text} />
                </PressableScale>
              </View>
            )}
            {mode === 'days' ? (
              <>
                <View style={styles.weekRow}>
                  {WEEKDAYS.map((w, i) => (
                    <Text key={i} style={styles.weekday}>{w}</Text>
                  ))}
                </View>
                <View style={styles.grid}>
                  {buildGrid(cursor.year, cursor.month).map((day, i) => {
                    if (day == null) return <View key={i} style={styles.cell} />;
                    const iso = toIso(cursor.year, cursor.month, day);
                    const selected = iso === value;
                    const isToday = iso === toIso(today.getFullYear(), today.getMonth(), today.getDate());
                    return (
                      <PressableScale
                        key={i}
                        scaleTo={0.9}
                        style={[styles.cell, selected && styles.cellSelected, !selected && isToday && styles.cellToday]}
                        onPress={() => {
                          onChange(iso);
                          setOpen(false);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                      >
                        <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{day}</Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </>
            ) : (
              <View style={styles.monthGrid}>
                {MONTHS.map((m, i) => {
                  const on = i === cursor.month;
                  return (
                    <PressableScale
                      key={m}
                      scaleTo={0.95}
                      style={[styles.monthCell, on && styles.cellSelected]}
                      onPress={() => {
                        setCursor((c) => ({ ...c, month: i }));
                        setMode('days');
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.monthCellText, on && styles.cellTextSelected]}>{m}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  label: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bodySemiBold, marginBottom: 4, marginLeft: spacing.xs },
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
  sheetTitle: { fontSize: 17, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.md },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthNav: { padding: spacing.xs, borderRadius: radius.sm },
  monthLabel: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginBottom: 2,
  },
  cellToday: { borderWidth: 1, borderColor: colors.accentStrong },
  cellSelected: { backgroundColor: colors.accentStrong },
  cellText: { fontSize: 14, color: colors.text },
  cellTextSelected: { color: '#fff', fontFamily: fonts.bodyBold },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  monthCell: {
    width: '33.3333%',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  monthCellText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.text },
});
