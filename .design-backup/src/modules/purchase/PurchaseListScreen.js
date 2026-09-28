import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';
import { getPurchases } from './services';

const statusColor = {
  Received: colors.success,
  Pending: colors.warning,
  Cancelled: colors.danger,
};

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

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} style={styles.iconBtn}>
          <Ionicons name="person-circle-outline" size={26} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchases</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddPurchase')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total Purchase Value</Text>
          <Text style={styles.summaryValue}>₹{total.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryIcon}>
          <Ionicons name="cart" size={26} color={colors.primaryDark} />
        </View>
      </View>

      <View style={styles.filters}>
        {['All', 'Pending', 'Received', 'Cancelled'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, filter === f && styles.chipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.poId}>{item.id}</Text>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor[item.status]}22` }]}>
                <Text style={[styles.statusText, { color: statusColor[item.status] }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.supplier}>{item.supplier}</Text>
            <View style={styles.metaRow}>
              <Meta icon="calendar-outline" text={item.date} />
              <Meta icon="cube-outline" text={`${item.items} items`} />
              <Meta icon="cash-outline" text={`₹${item.total.toLocaleString()}`} />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No purchases in this filter.</Text>}
      />
    </SafeAreaView>
  );
}

function Meta({ icon, text }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <Text style={styles.metaText}>{text}</Text>
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  summaryLabel: { fontSize: 12, color: colors.textMuted },
  summaryValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 4 },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  poId: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  statusText: { fontSize: 11, fontWeight: '700' },
  supplier: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
