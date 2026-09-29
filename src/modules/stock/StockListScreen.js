import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { getStockItems } from './services';

export default function StockListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    try {
      setItems(await getStockItems());
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

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = items.reduce((s, i) => s + i.qty * i.price, 0);
  const lowStock = items.filter((i) => i.qty <= i.lowAt).length;

  const header = (
    <>
      <View style={styles.summaryRow}>
        <Animated.View entering={enter(1)} style={[styles.tile, styles.tileLight]}>
          <Text style={styles.tileValueInk}>{items.length}</Text>
          <Text style={styles.tileLabelInk}>Total items</Text>
        </Animated.View>
        <Animated.View entering={enter(2)} style={styles.tile}>
          <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
            ₹{totalValue.toLocaleString()}
          </Text>
          <Text style={styles.tileLabel}>Stock value</Text>
        </Animated.View>
        <Animated.View entering={enter(3)} style={styles.tile}>
          <Text style={[styles.tileValue, lowStock > 0 && { color: colors.danger }]}>{lowStock}</Text>
          <Text style={styles.tileLabel}>Low stock</Text>
        </Animated.View>
      </View>

      <Animated.View entering={enter(4)} style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stock item"
          placeholderTextColor={colors.textFaint}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search stock"
        />
      </Animated.View>
    </>
  );

  return (
    <Screen>
      <ScreenHeader
        large
        title="Stock"
        left={
          <IconButton icon="person" variant="light" accessibilityLabel="Profile and settings"
            onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} />
        }
        right={
          <IconButton icon="add" variant="light" accessibilityLabel="Add stock item"
            onPress={() => navigation.navigate('AddStock')} />
        }
      />

      <Animated.FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={layout}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => {
          const low = item.qty <= item.lowAt;
          return (
            <Animated.View entering={enter(index + 4)} exiting={fadeOut} style={styles.card}>
              <View style={styles.thumb}>
                <Icon name="cube" size={22} color={colors.ink} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.sub}>{item.id} • {item.category}</Text>
                <Text style={styles.sub}>₹{item.price} / {item.unit}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.qty, low && { color: colors.danger }]}>
                  {item.qty} {item.unit}
                </Text>
                <View style={[styles.badge, low ? styles.badgeLow : styles.badgeOk]}>
                  <Text style={[styles.badgeText, { color: low ? colors.danger : colors.success }]}>
                    {low ? 'Low' : 'In stock'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          !loaded ? null : error ? (
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
              actionLabel="Add item"
              onAction={() => navigation.navigate('AddStock')}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
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
  tileValue: { fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.text },
  tileLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tileValueInk: { fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.ink },
  tileLabelInk: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.lg,
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
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  qty: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  badgeLow: { backgroundColor: `${colors.danger}22` },
  badgeOk: { backgroundColor: `${colors.success}1F` },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
