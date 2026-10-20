import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, Platform, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import Icon from '../../components/Icon';
import IconButton from '../../components/IconButton';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import { HEADER_HEIGHT_LARGE_NO_BACK } from '../../components/ScreenHeader';
import AddButton from '../../components/AddButton';
import PressableScale from '../../components/PressableScale';
import EmptyState from '../../components/EmptyState';
import SharedBadge from '../../components/SharedBadge';
import SelectField from '../../components/SelectField';
import InputField from '../../components/InputField';
import { colors, spacing, radius, shadows, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';
import { rupees } from '../../utils/format';
import { getBranches, getCategories } from '../../api';
import { toOptions } from '../manage/entities';
import { ADVANCED_SEARCH_READY, getStockItems, searchStockItems } from './services';

function LegendItem({ color, label, count }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>
        {label} <Text style={styles.legendCount}>{count}</Text>
      </Text>
    </View>
  );
}

export default function StockListScreen({ navigation }) {
  const { can } = useAuth();
  const canCreate = can('create', 'product');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('restock');
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  useEffect(() => {
    getCategories().then((res) => setCategories(toOptions(res))).catch(() => setCategories([]));
    getBranches().then((res) => setBranches(toOptions(res))).catch(() => setBranches([]));
  }, []);

  const filtering = !!(categoryId || branchId || barcode);
  const filterLocked = filtering && !ADVANCED_SEARCH_READY;

  const load = async () => {
    if (filterLocked) {
      setItems([]);
      setLoaded(true);
      return;
    }
    try {
      setItems(
        filtering
          ? await searchStockItems({ categoryId, branchId, barcode, search: barcode ? '' : search })
          : await getStockItems()
      );
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [categoryId, branchId, barcode]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const searched = filtering
    ? items
    : items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      );

  const totalValue = items.reduce((s, i) => s + i.qty * i.price, 0);
  const outCount = items.filter((i) => i.qty <= 0).length;
  const lowStock = items.filter((i) => i.qty > 0 && i.qty <= i.lowAt).length;
  const okCount = items.length - lowStock - outCount;
  const byStatus =
    status === 'low' ? searched.filter((i) => i.qty > 0 && i.qty <= i.lowAt)
    : status === 'out' ? searched.filter((i) => i.qty <= 0)
    : searched;
  const ratio = (i) => i.qty / Math.max(i.lowAt, 1);
  const filtered =
    sort === 'restock' ? [...byStatus].sort((a, b) => ratio(a) - ratio(b))
    : sort === 'value' ? [...byStatus].sort((a, b) => b.qty * b.price - a.qty * a.price)
    : [...byStatus].sort((a, b) => a.name.localeCompare(b.name));
  const sortLabel = { name: 'A–Z', restock: 'Restock first', value: 'Highest value' }[sort];
  const nextSort = { name: 'restock', restock: 'value', value: 'name' }[sort];
  const statusChips = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'low', label: 'Low', count: lowStock, tone: 'warning' },
    { key: 'out', label: 'Out', count: outCount, tone: 'danger' },
  ];

  const header = (
    <>
      <Animated.View entering={enter(1)} style={styles.overview}>
        <View style={styles.overviewTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.overviewLabel}>Stock value</Text>
            <Text style={styles.overviewValue} numberOfLines={1} adjustsFontSizeToFit>{rupees(totalValue)}</Text>
          </View>
          <View style={styles.overviewCount}>
            <Text style={styles.overviewCountNum}>{items.length}</Text>
            <Text style={styles.overviewCountLabel}>items</Text>
          </View>
        </View>
        <View style={styles.healthBar}>
          {items.length ? (
            <>
              {okCount ? <View style={{ flex: okCount, backgroundColor: colors.green }} /> : null}
              {lowStock ? <View style={{ flex: lowStock, backgroundColor: colors.warning }} /> : null}
              {outCount ? <View style={{ flex: outCount, backgroundColor: colors.danger }} /> : null}
            </>
          ) : null}
        </View>
        <View style={styles.legend}>
          <LegendItem color={colors.green} label="Healthy" count={okCount} />
          <LegendItem color={colors.warning} label="Low" count={lowStock} />
          <LegendItem color={colors.danger} label="Out" count={outCount} />
        </View>
      </Animated.View>

      <Animated.View entering={enter(4)} style={styles.searchRow}>
        <View style={[styles.searchBox, { flex: 1 }]}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stock item"
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search stock"
            returnKeyType="search"
          />
          {search ? (
            <PressableScale scaleTo={0.85} onPress={() => setSearch('')} hitSlop={10} accessibilityLabel="Clear search" style={styles.clear}>
              <Icon name="close" size={14} color={colors.textMuted} />
            </PressableScale>
          ) : null}
        </View>
        <View>
          <IconButton
            icon="options-outline"
            variant={showFilters ? 'light' : 'dark'}
            size={46}
            accessibilityLabel="Toggle filters"
            onPress={() => setShowFilters((s) => !s)}
          />
          {filtering ? <View style={styles.filterDot} pointerEvents="none" /> : null}
        </View>
      </Animated.View>

      <Animated.View entering={enter(5)} style={styles.chipRow}>
        {statusChips.map((c) => {
          const active = status === c.key;
          const dot = c.tone === 'danger' ? colors.danger : c.tone === 'warning' ? colors.warning : null;
          return (
            <PressableScale
              key={c.key}
              scaleTo={0.95}
              onPress={() => setStatus(c.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${c.label}, ${c.count} items`}
              style={[styles.chip, active && styles.chipActive]}
            >
              {dot ? <View style={[styles.chipDot, { backgroundColor: dot }]} /> : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              <Text style={[styles.chipCount, active && styles.chipCountActive]}>{c.count}</Text>
            </PressableScale>
          );
        })}
        <PressableScale
          scaleTo={0.95}
          onPress={() => setSort(nextSort)}
          accessibilityLabel={`Sorted by ${sortLabel}. Tap to change sort`}
          style={styles.sortBtn}
        >
          <Text style={styles.sortText} numberOfLines={1}>Sort: <Text style={styles.sortValue}>{sortLabel}</Text></Text>
        </PressableScale>
      </Animated.View>

      {showFilters ? (
        <Animated.View entering={enter(5)} style={styles.filters}>
          <View style={styles.filterPair}>
            <SelectField style={styles.filterCell} label="Category" icon="albums-outline" placeholder="All" value={categoryId} options={categories} onChange={setCategoryId} />
            <SelectField style={styles.filterCell} label="Branch" icon="business-outline" placeholder="All" value={branchId} options={branches} onChange={setBranchId} />
          </View>
          <InputField label="Barcode" icon="barcode-outline" placeholder="Scan or type a barcode" value={barcode} onChangeText={setBarcode} />
        </Animated.View>
      ) : null}
    </>
  );

  return (
    <Screen>
      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        itemLayoutAnimation={layout}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => {
          const out = item.qty <= 0;
          const low = !out && item.qty <= item.lowAt;
          const level = out ? 0 : Math.min(1, item.qty / Math.max(item.lowAt * 3, 1));
          const barColor = out || low ? (out ? colors.danger : colors.warning) : colors.green;
          return (
            <Animated.View entering={enter(index + 4)} exiting={fadeOut}>
              <PressableScale
                scaleTo={0.98}
                style={styles.card}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.productId, name: item.name })}
                accessibilityLabel={`Open ${item.name}, ${item.qty} ${item.unit} in stock${out ? ', out of stock' : low ? ', low stock' : ''}`}
              >
                <View style={styles.cardTop}>
                  <SharedBadge tag={`stock-${item.productId}`} icon="cube" size={44} radius={14} />
                  <View style={styles.cardBody}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.sub} numberOfLines={1}>{item.category} · {rupees(item.price)}/{item.unit}</Text>
                  </View>
                  <View style={styles.cardEnd}>
                    <Text style={[styles.qty, out && { color: colors.dangerStrong }]} numberOfLines={1}>
                      {item.qty}
                      <Text style={styles.qtyUnit}> {item.unit}</Text>
                    </Text>
                    {out || low ? (
                      <View style={[styles.pill, out ? styles.pillOut : styles.pillLow]}>
                        <View style={[styles.pillDot, { backgroundColor: barColor }]} />
                        <Text style={[styles.pillText, { color: out ? colors.dangerStrong : colors.warningStrong }]}>
                          {out ? 'Out' : 'Low'}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.max(level * 100, out ? 0 : 6)}%`, backgroundColor: barColor }]} />
                </View>
              </PressableScale>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          !loaded ? null : filterLocked ? (
            <EmptyState
              tone="locked"
              icon="lock-closed-outline"
              title="Advanced filters"
              message="Filtering stock by category, branch or barcode unlocks as soon as the backend ships support for it. Clear the filters to keep browsing your full stock list."
            />
          ) : error ? (
            <EmptyState
              tone="error"
              icon="cloud-offline-outline"
              title="Can't load stock"
              message={error}
              actionLabel="Try again"
              onAction={onRefresh}
            />
          ) : status !== 'all' && items.length ? (
            <EmptyState
              icon="checkmark"
              title={status === 'low' ? 'Nothing running low' : 'Nothing out of stock'}
              message="Everything here is well stocked. Switch to All to see every item."
              actionLabel="Show all"
              onAction={() => setStatus('all')}
            />
          ) : search ? (
            <EmptyState icon="search-outline" title="No matches" message={`Nothing in stock matches "${search}".`} />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No stock yet"
              message="Add your first item to start tracking inventory."
              actionLabel={canCreate ? 'Add item' : undefined}
              onAction={canCreate ? () => navigation.navigate('AddStock') : undefined}
            />
          )
        }
      />
      {canCreate ? (
        <AddButton
          accessibilityLabel="Add stock item"
          scrollY={scrollY}
          inHeader
          onPress={() => navigation.navigate('AddStock')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE_NO_BACK, paddingBottom: 112 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  filters: { marginBottom: spacing.md },
  filterPair: { flexDirection: 'row', gap: spacing.md },
  filterCell: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.text },
  chipTextActive: { color: colors.onAccent },
  chipCount: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  chipCountActive: { color: colors.onAccent, opacity: 0.8 },
  card: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardBody: { flex: 1, minWidth: 0, marginLeft: spacing.md, marginRight: spacing.sm },
  cardEnd: { alignItems: 'flex-end' },
  name: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text, letterSpacing: -0.1 },
  sub: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
  qty: { fontSize: 18, fontFamily: fonts.display, color: colors.text, letterSpacing: -0.4 },
  qtyUnit: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.textMuted, letterSpacing: 0 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.elevated2, overflow: 'hidden', marginTop: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  fill: { height: '100%', borderRadius: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillLow: { backgroundColor: `${colors.warning}2E` },
  pillOut: { backgroundColor: `${colors.danger}1F` },
  pillText: { fontSize: 11, fontFamily: fonts.bodySemiBold, letterSpacing: 0.1 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto', height: 34, paddingHorizontal: 6 },
  sortText: { fontSize: 12.5, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  sortValue: { fontFamily: fonts.bodySemiBold, color: colors.text },
  overview: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  overviewTop: { flexDirection: 'row', alignItems: 'flex-end' },
  overviewLabel: { fontSize: 12.5, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  overviewValue: { fontSize: 30, lineHeight: 36, fontFamily: fonts.display, letterSpacing: -1, color: colors.text },
  overviewCount: { alignItems: 'flex-end', paddingLeft: spacing.md },
  overviewCountNum: { fontSize: 20, fontFamily: fonts.display, color: colors.text, letterSpacing: -0.4 },
  overviewCountLabel: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  healthBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginTop: spacing.md, backgroundColor: colors.elevated2 },
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  legendCount: { fontFamily: fonts.bodySemiBold, color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
