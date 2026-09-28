import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import BarChart from '../components/BarChart';
import { colors, spacing, radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  dashboardStats,
  orderOverview,
  topSellingDishes,
  salesPurchaseData,
} from '../data/dashboardData';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} style={styles.iconBtn}>
          <Ionicons name="person-circle-outline" size={26} color={colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, supplier, order"
            placeholderTextColor={colors.muted}
          />
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greeting}>
          <Text style={styles.hello}>Hi, {user?.name || 'Admin'} 👋</Text>
          <Text style={styles.helloSub}>Here's what's happening in your store today</Text>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard
            icon="cart"
            label="Orders so far"
            value={dashboardStats.ordersSoFar.value}
            delta={dashboardStats.ordersSoFar.delta}
            tint={colors.primaryDark}
          />
          <StatCard
            icon="trending-up"
            label="Profit"
            value={dashboardStats.profit.value}
            delta={dashboardStats.profit.delta}
            tint={colors.accent}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
          <StatCard
            icon="people"
            label="Unique Customers"
            value={dashboardStats.uniqueCustomers.value}
            delta={dashboardStats.uniqueCustomers.delta}
            tint={colors.info}
          />
          <View style={{ flex: 1, marginHorizontal: spacing.xs }} />
        </View>

        {/* Order Purchase Overview */}
        <SectionCard title="Order Purchase Overview" style={{ marginTop: spacing.md }}>
          <View style={styles.overviewRow}>
            <Overview icon="bag-handle" tint={colors.info} value={orderOverview.noOfOrder} label="No of Order" />
            <Overview icon="home" tint={colors.success} value={orderOverview.totalCost} label="Total Cost" />
            <Overview icon="card" tint={colors.warning} value={orderOverview.cancel} label="Cancel" />
            <Overview icon="bar-chart" tint={colors.accent} value={orderOverview.returnAmt} label="Return" />
          </View>
        </SectionCard>

        {/* Top Selling */}
        <SectionCard
          title="Top Selling Dishes"
          right={
            <View style={styles.chip}>
              <Text style={styles.chipText}>Today</Text>
            </View>
          }
        >
          {topSellingDishes.map((d) => (
            <View key={d.id} style={styles.dishRow}>
              <View style={styles.dishIcon}>
                <Ionicons name={d.icon} size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.dishName}>{d.name}</Text>
                <Text style={styles.dishOrders}>{d.orders} Orders</Text>
              </View>
              <Text style={styles.dishProfit}>{d.profit} Profit</Text>
            </View>
          ))}
        </SectionCard>

        {/* Sales & Purchase */}
        <SectionCard
          title="Sales & Purchase"
          right={
            <View style={styles.chip}>
              <Ionicons name="calendar-outline" size={13} color={colors.text} />
              <Text style={[styles.chipText, { marginLeft: 4 }]}>Weekly</Text>
            </View>
          }
        >
          <BarChart data={salesPurchaseData} />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview({ icon, value, label, tint }) {
  return (
    <View style={styles.overviewItem}>
      <View style={[styles.overviewIcon, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    height: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 13, color: colors.text, paddingVertical: 0 },
  body: { flex: 1, backgroundColor: colors.surfaceAlt },
  greeting: { paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  hello: { fontSize: 20, fontWeight: '700', color: colors.text },
  helloSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row' },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewItem: { alignItems: 'center', flex: 1 },
  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  overviewValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  overviewLabel: { fontSize: 11, color: colors.textMuted },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  chipText: { fontSize: 11, fontWeight: '600', color: colors.text },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dishIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: '#FEF2E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishName: { fontSize: 14, fontWeight: '600', color: colors.text },
  dishOrders: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dishProfit: { fontSize: 12, fontWeight: '700', color: colors.success },
});
