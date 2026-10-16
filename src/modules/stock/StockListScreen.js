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
import SummaryTiles from '../../components/SummaryTiles';
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

  const filtered = filtering
    ? items
    : items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.category.toLowerCase().includes(search.toLowerCase())
      );

  const totalValue = items.reduce((s, i) => s + i.qty * i.price, 0);
  const lowStock = items.filter((i) => i.qty <= i.lowAt).length;

  const header = (
    <>
      <SummaryTiles
        tiles={[
          { value: items.length, label: 'Total items', tone: 'light' },
          { value: rupees(totalValue), label: 'Stock value' },
          { value: lowStock, label: 'Low stock', tone: lowStock > 0 ? 'danger' : undefined },
        ]}
      />

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
          />
        </View>
        <IconButton
          icon="options-outline"
          variant={showFilters ? 'light' : 'dark'}
          size={44}
          accessibilityLabel="Toggle filters"
          onPress={() => setShowFilters((s) => !s)}
        />
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
          const low = item.qty <= item.lowAt;
          return (
            <Animated.View entering={enter(index + 4)} exiting={fadeOut}>
              <PressableScale
                scaleTo={0.98}
                style={[styles.card, low && styles.cardLow]}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.productId, name: item.name })}
                accessibilityLabel={`Open ${item.name}`}
              >
              <SharedBadge tag={`stock-${item.productId}`} icon="cube" size={40} radius={12} />
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.category} · {rupees(item.price)}/{item.unit}
                </Text>
              </View>
              <View style={styles.cardEnd}>
                <Text style={[styles.qty, low && { color: colors.dangerStrong }]} numberOfLines={1}>
                  {item.qty} <Text style={styles.qtyUnit}>{item.unit}</Text>
                </Text>
                {low ? (
                  <View style={styles.badgeLow}>
                    <Text style={styles.badgeText}>{out ? 'Out' : 'Low'}</Text>
                  </View>
                ) : null}
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
  cardLow: { borderColor: `${colors.danger}33` },
  cardBody: { flex: 1, minWidth: 0, marginLeft: spacing.md, marginRight: spacing.sm },
  cardEnd: { alignItems: 'flex-end' },
  name: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  sub: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  qty: { fontSize: 15, fontWeight: '700', color: colors.text },
  qtyUnit: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  badgeLow: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: `${colors.danger}1F` },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.dangerStrong, letterSpacing: 0.2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
