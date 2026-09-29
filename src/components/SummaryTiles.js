import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, radius, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';

// The compact stat row that tops every list page (Stock, Purchases, Sales) so they all read the
// same. tone: 'light' = charcoal-on-white highlight, 'danger' = red value, default = dark tile.
export default function SummaryTiles({ tiles }) {
  return (
    <Animated.View style={styles.row}>
      {tiles.map((t, i) => {
        const light = t.tone === 'light';
        return (
          <Animated.View key={t.label} entering={enter(i + 1)} style={[styles.tile, light && styles.tileLight]}>
            <Text
              style={[styles.value, light && { color: colors.ink }, t.tone === 'danger' && { color: colors.danger }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t.value}
            </Text>
            <Text style={[styles.label, light && { color: colors.inkMuted }]}>{t.label}</Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.lg },
  tile: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 96,
    justifyContent: 'flex-end',
  },
  tileLight: { backgroundColor: colors.card, borderColor: colors.card },
  value: { fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.text },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
