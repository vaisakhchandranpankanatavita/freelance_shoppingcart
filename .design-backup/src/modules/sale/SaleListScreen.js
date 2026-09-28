import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, radius } from '../../theme';
import { getSales } from './services';

const modeIcon = { UPI: 'phone-portrait-outline', Cash: 'cash-outline', Card: 'card-outline' };

export default function SaleListScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => setData(await getSales());
  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayTotal = data.filter((s) => s.date === today).reduce((s, x) => s + x.total, 0);
  const todayCount = data.filter((s) => s.date === today).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} style={styles.iconBtn}>
          <Ionicons name="person-circle-outline" size={26} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NewSale')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="receipt-outline" size={20} color={colors.primaryDark} />
          <Text style={styles.summaryValue}>{todayCount}</Text>
          <Text style={styles.summaryLabel}>Today's Bills</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cash-outline" size={20} color={colors.success} />
          <Text style={styles.summaryValue}>₹{todayTotal.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Today's Sales</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SaleDetail', { sale: item })}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={colors.primaryDark} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.customer}>{item.customer}</Text>
              <Text style={styles.sub}>{item.id} • {item.date}</Text>
              <View style={styles.modeRow}>
                <Ionicons name={modeIcon[item.mode] || 'card-outline'} size={12} color={colors.textMuted} />
                <Text style={styles.modeText}>{item.mode} • {item.items} items</Text>
              </View>
            </View>
            <Text style={styles.total}>₹{item.total.toLocaleString()}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sales yet.</Text>}
      />
    </SafeAreaView>
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
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
  summaryLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  customer: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  modeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  modeText: { fontSize: 11, color: colors.textMuted },
  total: { fontSize: 16, fontWeight: '700', color: colors.success },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
