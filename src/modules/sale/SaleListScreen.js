import React, { useCallback, useMemo, useState } from 'react';
import { Platform, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import AddButton from '../../components/AddButton';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import { HEADER_HEIGHT_LARGE_NO_BACK } from '../../components/ScreenHeader';
import PressableScale from '../../components/PressableScale';
import SummaryTiles from '../../components/SummaryTiles';
import SegmentedControl from '../../components/SegmentedControl';
import SharedBadge from '../../components/SharedBadge';
import EmptyState from '../../components/EmptyState';
import { colors, radius, shadows, spacing, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { plural, rupees, shortDate } from '../../utils/format';
import { getSales } from './services';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This month' },
];

const PAYMENT_ICONS = {
  cash: 'cash-outline',
  upi: 'qr-code-outline',
  card: 'card-outline',
};

const localDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function SaleListScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  const load = useCallback(async () => {
    try {
      setData(await getSales());
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const today = localDateKey(new Date());

  const visibleSales = useMemo(() => {
    const month = today.slice(0, 7);
    const q = query.trim().toLowerCase();
    return [...data]
      .filter((sale) => {
        if (filter === 'today' && sale.date !== today) return false;
        if (filter === 'month' && !sale.date.startsWith(month)) return false;
        if (!q) return true;
        return `${sale.id} ${sale.customer} ${sale.phone} ${sale.mode}`.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data, filter, query, today]);

  const todayTotal = data.filter((s) => s.date === today).reduce((sum, s) => sum + s.total, 0);
  const total = data.reduce((sum, s) => sum + s.total, 0);

  const header = (
    <>
      <SummaryTiles
        tiles={[
          { value: rupees(todayTotal), label: 'Sold today', tone: 'light' },
          { value: rupees(total), label: 'All bills' },
          { value: data.length, label: 'Bills' },
        ]}
      />

      <Animated.View entering={enter(4)} style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, phone or bill no."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          accessibilityLabel="Search bills"
          returnKeyType="search"
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </Animated.View>

      <Animated.View entering={enter(5)}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} underline style={styles.filters} />
      </Animated.View>

      {error && data.length > 0 ? (
        <View style={styles.inlineError} accessibilityRole="alert">
          <Icon name="cloud-offline-outline" size={16} color={colors.dangerStrong} />
          <Text style={styles.inlineErrorText}>Showing the last loaded bills. {error}</Text>
          <PressableScale onPress={onRefresh} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retry">
            <Text style={styles.retryText}>Retry</Text>
          </PressableScale>
        </View>
      ) : null}
    </>
  );

  const empty = !loaded ? null : error && data.length === 0 ? (
    <EmptyState
      tone="error"
      icon="cloud-offline-outline"
      title="Can't load bills"
      message={error}
      actionLabel="Try again"
      onAction={onRefresh}
    />
  ) : data.length === 0 ? (
    <EmptyState
      icon="receipt-outline"
      title="No bills yet"
      message="Every checkout you complete is listed here."
      actionLabel="New bill"
      onAction={() => navigation.navigate('NewSale', { saleId: undefined })}
    />
  ) : (
    <EmptyState
      icon="search-outline"
      title="No matching bills"
      message={query ? `Nothing matches "${query.trim()}".` : 'No bills in this period yet.'}
    />
  );

  return (
    <Screen>
      <Animated.FlatList
        data={visibleSales}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
        itemLayoutAnimation={layout}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => {
          const name = item.customer || 'Walk-in';
          return (
            <Animated.View entering={enter(index + 6)} exiting={fadeOut}>
              <PressableScale
                scaleTo={0.98}
                style={styles.card}
                onPress={() => navigation.navigate('SaleDetail', { sale: item })}
                accessibilityLabel={`Bill ${item.id}, ${name}, ${rupees(item.total)}. Open details`}
              >
                <SharedBadge tag={`sale-${item.id}`} letter={name.charAt(0).toUpperCase()} size={40} radius={20} />
                <View style={styles.cardBody}>
                  <Text style={styles.customer} numberOfLines={1}>{name}</Text>
                  <View style={styles.metaRow}>
                    <Icon name={PAYMENT_ICONS[String(item.mode).toLowerCase()] || 'wallet-outline'} size={13} color={colors.textMuted} />
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.mode} · Bill {item.id} · {plural(item.items, 'item')}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardEnd}>
                  <Text style={styles.amount} numberOfLines={1}>{rupees(item.total)}</Text>
                  <Text style={styles.date}>{item.date === today ? 'Today' : shortDate(item.date)}</Text>
                </View>
              </PressableScale>
            </Animated.View>
          );
        }}
      />
      <AddButton accessibilityLabel="New bill" scrollY={scrollY} inHeader onPress={() => navigation.navigate('NewSale', { saleId: undefined })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE_NO_BACK, paddingBottom: 112 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  filters: { marginBottom: spacing.md },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${colors.danger}12`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inlineErrorText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17 },
  retryText: { color: colors.accentStrong, fontSize: 13, fontFamily: fonts.bodyBold },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs + 2,
    ...shadows.sm,
  },
  cardBody: { flex: 1, minWidth: 0, marginLeft: spacing.md, marginRight: spacing.sm },
  customer: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  meta: { flexShrink: 1, fontSize: 12, color: colors.textMuted },
  cardEnd: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text, fontVariant: ['tabular-nums'] },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
});
