import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import Heading from '../../components/Heading';
import SectionCard from '../../components/SectionCard';
import SegmentedControl from '../../components/SegmentedControl';
import { colors, spacing, radius } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { getPurchases } from './services';

const statusColor = {
  Received: colors.success,
  Pending: colors.warning,
  Cancelled: colors.danger,
};

const FILTERS = ['All', 'Pending', 'Received', 'Cancelled'].map((f) => ({ key: f, label: f }));

export default function PurchaseListScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');

  const load = async () => setData(await getPurchases());

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = filter === 'All' ? data : data.filter((d) => d.status === filter);
  const total = data.reduce((s, d) => s + d.total, 0);

  const header = (
    <>
      <SectionCard tone="light" fade index={1} style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Icon name="cart" size={22} color={colors.ink} />
        </View>
        <Text style={styles.summaryLabel}>Total purchase value</Text>
        <Heading level="title" tone="light" style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
          ₹{total.toLocaleString()}
        </Heading>
      </SectionCard>
      <Animated.View entering={enter(2)}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} style={styles.filters} />
      </Animated.View>
    </>
  );

  return (
    <Screen>
      <ScreenHeader
        large
        title="Purchases"
        left={
          <IconButton icon="person" variant="light" accessibilityLabel="Profile and settings"
            onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} />
        }
        right={
          <IconButton icon="add" variant="light" accessibilityLabel="New purchase order"
            onPress={() => navigation.navigate('AddPurchase')} />
        }
      />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={layout}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter(index + 3)} exiting={fadeOut} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.poId}>{item.id}</Text>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor[item.status]}22` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] }]} />
                <Text style={[styles.statusText, { color: statusColor[item.status] }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.supplier}>{item.supplier}</Text>
            <View style={styles.metaRow}>
              <Meta icon="calendar-outline" text={item.date} />
              <Meta icon="cube-outline" text={`${item.items} items`} />
              <Meta icon="cash-outline" text={`₹${item.total.toLocaleString()}`} />
            </View>
          </Animated.View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No purchases in this filter.</Text>}
      />
    </Screen>
  );
}

function Meta({ icon, text }) {
  return (
    <View style={styles.meta}>
      <Icon name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  summaryCard: { padding: 24, minHeight: 170, justifyContent: 'flex-end' },
  summaryIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { fontSize: 14, color: colors.inkMuted },
  summaryValue: { fontSize: 44, lineHeight: 48, letterSpacing: -2, marginTop: 4 },
  filters: { marginVertical: spacing.md },
  card: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  poId: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '700' },
  supplier: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: colors.text, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
