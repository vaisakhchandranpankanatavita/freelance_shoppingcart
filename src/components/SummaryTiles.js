import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, radius, shadows, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';

// The compact stat row that tops every list page (Stock, Purchases, Sales) so they all read the
// same. tone: 'light' = soft tinted highlight tile, 'danger' = red value, default = plain white tile.
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
            <Text style={[styles.label, light && { color: colors.inkMuted }]} numberOfLines={1}>{t.label}</Text>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 68,
    justifyContent: 'flex-end',
    ...shadows.sm,
  },
  tileLight: { backgroundColor: colors.cardAlt, borderColor: colors.cardAlt },
  value: { fontSize: 19, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.text },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
