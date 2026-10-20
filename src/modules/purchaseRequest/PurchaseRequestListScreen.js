import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT_LARGE } from '../../components/ScreenHeader';
import AddButton from '../../components/AddButton';
import PressableScale from '../../components/PressableScale';
import SummaryTiles from '../../components/SummaryTiles';
import SegmentedControl from '../../components/SegmentedControl';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, shadows, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_READY, getRequests } from './services';

const statusColor = {
  Pending: colors.warning,
  Approved: colors.accent,
  Converted: colors.success,
  Rejected: colors.danger,
};
const statusTextColor = {
  Pending: colors.warningStrong,
  Approved: colors.accentStrong,
  Converted: colors.successStrong,
  Rejected: colors.dangerStrong,
};

const FILTERS = ['All', 'Pending', 'Approved', 'Converted', 'Rejected'].map((f) => ({ key: f, label: f }));

export default function PurchaseRequestListScreen({ navigation }) {
  const { can } = useAuth();
  const canCreate = BACKEND_READY && can('create', 'purchaseRequest');
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  const load = async () => {
    if (!BACKEND_READY) {
      setLoaded(true);
      return;
    }
    try {
      setData(await getRequests());
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
  const pending = data.filter((d) => d.status === 'Pending').length;

  const header = !BACKEND_READY ? null : (
    <>
      <SummaryTiles
        tiles={[
          { value: data.length, label: 'Requests', tone: 'light' },
          { value: pending, label: 'Pending' },
          { value: data.filter((d) => d.status === 'Converted').length, label: 'Converted' },
        ]}
      />
      <Animated.View entering={enter(2)}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} underline style={styles.filters} />
      </Animated.View>
    </>
  );

  return (
    <Screen header={<ScreenHeader large title="Purchase requests" onBack={() => navigation.goBack()} />}>
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
              onPress={() => navigation.navigate('PurchaseRequestForm', { requestId: item.id })}
              accessibilityLabel={`Open purchase request ${item.id}`}
            >
              <View style={styles.cardHead}>
                <Text style={styles.poId} numberOfLines={1}>{item.id}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor[item.status]}22` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] }]} />
                  <Text style={[styles.statusText, { color: statusTextColor[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.supplier} numberOfLines={1}>{item.supplier}</Text>
              <View style={styles.metaRow}>
                <Meta icon="calendar-outline" text={item.date} />
                <Meta icon="cube-outline" text={`${item.items} items`} />
              </View>
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          !loaded ? null : !BACKEND_READY ? (
            <EmptyState
              tone="locked"
              icon="lock-closed-outline"
              title="Purchase requests"
              message="This feature unlocks as soon as the backend ships support for it. The screen is ready and will go live automatically."
            />
          ) : error ? (
            <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load requests" message={error} actionLabel="Try again" onAction={onRefresh} />
          ) : filter === 'All' ? (
            <EmptyState
              icon="clipboard-outline"
              title="No purchase requests"
              message="Raise a request when stock needs reordering."
              actionLabel={canCreate ? 'New request' : undefined}
              onAction={canCreate ? () => navigation.navigate('PurchaseRequestForm', { requestId: undefined }) : undefined}
            />
          ) : (
            <EmptyState icon="funnel-outline" title={`No ${filter.toLowerCase()} requests`} message="Try another filter." />
          )
        }
      />
      {canCreate ? (
        <AddButton
          accessibilityLabel="New purchase request"
          scrollY={scrollY}
          inHeader
          onPress={() => navigation.navigate('PurchaseRequestForm', { requestId: undefined })}
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
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE, paddingBottom: 112 },
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
  poId: { fontSize: 13, color: colors.textMuted, fontFamily: fonts.bodySemiBold, flexShrink: 1, marginRight: spacing.sm },
  statusPill: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: fonts.bodyBold },
  supplier: { fontSize: 18, fontFamily: fonts.bodyBold, letterSpacing: -0.3, color: colors.text, marginBottom: spacing.md },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
});
