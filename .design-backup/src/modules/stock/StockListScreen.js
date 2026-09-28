import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';
import { getStockItems } from './services';

export default function StockListScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await getStockItems();
    setItems(data);
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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} style={styles.iconBtn}>
          <Ionicons name="person-circle-outline" size={26} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Stock</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddStock')}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <SummaryTile label="Total Items" value={items.length} tint={colors.primaryDark} icon="cube" />
        <SummaryTile
          label="Stock Value"
          value={`₹${totalValue.toLocaleString()}`}
          tint={colors.success}
          icon="cash"
        />
        <SummaryTile label="Low Stock" value={lowStock} tint={colors.danger} icon="alert-circle" />
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stock item"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const low = item.qty <= item.lowAt;
          return (
            <View style={styles.card}>
              <View style={styles.thumb}>
                <Ionicons name="cube" size={22} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>
                  {item.id} • {item.category}
                </Text>
                <Text style={styles.sub}>
                  ₹{item.price} / {item.unit}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.qty, low && { color: colors.danger }]}>
                  {item.qty} {item.unit}
                </Text>
                {low ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Low</Text>
                  </View>
                ) : (
                  <Text style={styles.inStock}>In Stock</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No items match your search.</Text>
        }
      />
    </SafeAreaView>
  );
}

function SummaryTile({ label, value, tint, icon }) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tileIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileValue: { fontSize: 16, fontWeight: '700', color: colors.text },
  tileLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.text, paddingVertical: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  qty: { fontSize: 15, fontWeight: '700', color: colors.text },
  inStock: { fontSize: 11, color: colors.success, marginTop: 4 },
  badge: {
    marginTop: 4,
    backgroundColor: `${colors.danger}22`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: { fontSize: 10, color: colors.danger, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
