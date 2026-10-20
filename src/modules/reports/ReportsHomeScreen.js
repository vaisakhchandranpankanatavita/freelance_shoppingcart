import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import PressableScale from '../../components/PressableScale';
import { GlassCard } from '../../components/Glass';
import { colors, spacing, fonts } from '../../theme';
import { enter } from '../../theme/motion';
import { REPORTS } from './reports';

// Picker screen listing the 8 read-only reports (tracker rows 84-91); each opens ReportListScreen
// with its config key.
export default function ReportsHomeScreen({ navigation }) {
  const entries = Object.entries(REPORTS);

  return (
    <Screen header={<ScreenHeader title="Reports" onBack={() => navigation.goBack()} />}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(1)}>
          <GlassCard style={styles.card}>
            {entries.map(([key, config], idx) => (
              <PressableScale
                key={key}
                scaleTo={0.98}
                style={[styles.row, idx === entries.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => navigation.navigate('ReportDetail', { reportKey: key })}
                accessibilityRole="button"
                accessibilityLabel={config.title}
              >
                <View style={styles.rowIcon}>
                  <Icon name={config.icon} size={18} color={colors.text} />
                </View>
                <Text style={styles.rowLabel}>{config.title}</Text>
                <Icon name="chevron-forward" size={18} color={colors.textFaint} />
              </PressableScale>
            ))}
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: spacing.xl },
  card: { paddingVertical: 4, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(29,29,35,0.08)',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: { flex: 1, fontSize: 15, color: colors.text, fontFamily: fonts.bodyMedium },
});
