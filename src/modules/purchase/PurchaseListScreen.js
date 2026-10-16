import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { HEADER_HEIGHT_LARGE_NO_BACK } from '../../components/ScreenHeader';
import AddButton from '../../components/AddButton';
import PressableScale from '../../components/PressableScale';
import SummaryTiles from '../../components/SummaryTiles';
import SegmentedControl from '../../components/SegmentedControl';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, shadows } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';
import { plural, rupees, shortDate } from '../../utils/format';
import { getPurchases } from './services';

// Bright base tones for the dot/pill fill; `statusTextColor` below is the darker, text-safe
// variant of each (the base tones fail WCAG AA as foreground text on the light canvas).
const statusColor = {
  Received: colors.success,
  Pending: colors.warning,
  Cancelled: colors.danger,
};

const statusTextColor = {
  Received: colors.successStrong,
  Pending: colors.warningStrong,
  Cancelled: colors.dangerStrong,
};

const FILTERS = ['All', 'Pending', 'Received', 'Cancelled'].map((f) => ({ key: f, label: f }));

export default function PurchaseListScreen({ navigation }) {
  const { can } = useAuth();
  const canCreate = can('create', 'purchase');
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  const load = async () => {
    try {
      setData(await getPurchases());
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = filter === 'All' ? data : data.filter((d) => d.status === filter);
  const total = data.reduce((s, d) => s + d.total, 0);
  const pending = data.filter((d) => d.status === 'Pending').length;

  const header = (
    <>
      <SummaryTiles
        tiles={[
          { value: data.length, label: 'Orders', tone: 'light' },
          { value: rupees(total), label: 'Total value' },
          { value: pending, label: 'Pending' },
        ]}
      />
      <Animated.View entering={enter(2)}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} underline style={styles.filters} />
      </Animated.View>
    </>
  );

  return (
    <Screen>
      <Animated.FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        itemLayoutAnimation={layout}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter(index + 3)} exiting={fadeOut}>
            <PressableScale
              scaleTo={0.98}
              style={styles.card}
              onPress={() => navigation.navigate('AddPurchase', { purchaseId: item.id })}
              accessibilityLabel={`Open purchase order ${item.id}`}
            >
              <View style={styles.cardHead}>
                <Text style={styles.poId} numberOfLines={1}>Order {item.id}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor[item.status]}22` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] }]} />
                  <Text style={[styles.statusText, { color: statusTextColor[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.supplier} numberOfLines={1}>{item.supplier}</Text>
              <View style={styles.metaRow}>
                <Meta icon="calendar-outline" text={shortDate(item.date)} />
                <Meta icon="cube-outline" text={plural(item.items, 'item')} />
                <Meta icon="cash-outline" text={rupees(item.total)} />
              </View>
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          !loaded ? null : error ? (
            <EmptyState
              tone="error"
              icon="cloud-offline-outline"
              title="Can't load purchase orders"
              message={error}
              actionLabel="Try again"
              onAction={onRefresh}
            />
          ) : filter === 'All' ? (
            <EmptyState
              icon="cart-outline"
              title="No purchase orders"
              message="Create an order when you restock from a supplier."
              actionLabel={canCreate ? 'New purchase order' : undefined}
              onAction={canCreate ? () => navigation.navigate('AddPurchase', { purchaseId: undefined }) : undefined}
            />
          ) : (
            <EmptyState icon="funnel-outline" title={`No ${filter.toLowerCase()} orders`} message="Try another filter." />
          )
        }
      />
      {canCreate ? (
        <AddButton
          accessibilityLabel="New purchase order"
          scrollY={scrollY}
          inHeader
          onPress={() => navigation.navigate('AddPurchase', { purchaseId: undefined })}
        />
      ) : null}
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
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE_NO_BACK, paddingBottom: 112 },
  filters: { marginBottom: spacing.md },
  card: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  poId: { fontSize: 13, color: colors.textMuted, fontWeight: '600', flexShrink: 1, marginRight: spacing.sm },
  statusPill: {
    flexShrink: 0,
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
