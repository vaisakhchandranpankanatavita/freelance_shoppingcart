import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import IconButton from '../components/IconButton';
import Heading from '../components/Heading';
import PressableScale from '../components/PressableScale';
import StatCard from '../components/StatCard';
import SectionCard from '../components/SectionCard';
import BarChart from '../components/BarChart';
import { colors, spacing, radius } from '../theme';
import { enter } from '../theme/motion';
import { useAuth } from '../context/AuthContext';
import {
  dashboardStats,
  orderOverview,
  topSellingDishes,
  salesPurchaseData,
} from '../data/dashboardData';

// Shortcut row (the reference's story strip). `initial: false` keeps each
// stack's list screen underneath so Back behaves naturally.
const SHORTCUTS = [
  { key: 'sale', label: 'New bill', icon: 'receipt', tab: 'Sale', screen: 'NewSale' },
  { key: 'stock', label: 'Add stock', icon: 'cube', tab: 'Stock', screen: 'AddStock' },
  { key: 'po', label: 'New PO', icon: 'cart', tab: 'Purchase', screen: 'AddPurchase' },
  { key: 'sales', label: 'Sales', icon: 'pricetag', tab: 'Sale' },
];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          icon="person"
          variant="light"
          onPress={() => navigation.navigate('More')}
          accessibilityLabel="Profile and settings"
        />
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, supplier, order"
            placeholderTextColor={colors.textFaint}
            accessibilityLabel="Search"
          />
        </View>
        <IconButton icon="notifications-outline" accessibilityLabel="Notifications" />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Heading level="title" entering={enter(0)} style={styles.hello}>
          Hi, {user?.name || 'Admin'}
        </Heading>
        <Animated.Text entering={enter(1)} style={styles.helloSub}>
          Here's what's happening in your store today
        </Animated.Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcuts}
          style={styles.shortcutsScroller}
        >
          {SHORTCUTS.map((s, i) => (
            <PressableScale
              key={s.key}
              entering={enter(i + 1)}
              style={styles.shortcut}
              accessibilityLabel={s.label}
              onPress={() =>
                navigation.navigate(s.tab, s.screen ? { screen: s.screen, initial: false } : undefined)
              }
            >
              <View style={styles.shortcutTile}>
                <Icon name={s.icon} size={28} color={colors.ink} />
              </View>
              <Text style={styles.shortcutLabel} numberOfLines={1}>
                {s.label}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>

        {/* Hero — the reference's big faded white card */}
        <SectionCard tone="light" fade index={2} style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Icon name="bag-handle" size={20} color={colors.text} />
            </View>
            <View>
              <Text style={styles.heroKicker}>Orders so far</Text>
              <Text style={styles.heroMeta}>This month</Text>
            </View>
          </View>
          <Heading level="display" tone="light" style={styles.heroValue}>
            {dashboardStats.ordersSoFar.value}
          </Heading>
          <View style={styles.heroDelta}>
            <Icon name="trending-up" size={14} color={colors.text} />
            <Text style={styles.heroDeltaText}>{dashboardStats.ordersSoFar.delta} vs last month</Text>
          </View>
        </SectionCard>

        <View style={styles.statsRow}>
          <StatCard
            icon="trending-up"
            label="Profit"
            value={dashboardStats.profit.value}
            delta={dashboardStats.profit.delta}
            index={3}
          />
          <StatCard
            icon="people"
            label="Unique customers"
            value={dashboardStats.uniqueCustomers.value}
            delta={dashboardStats.uniqueCustomers.delta}
            index={4}
          />
        </View>

        <SectionCard title="Order overview" index={5}>
          <View style={styles.overviewRow}>
            <Overview icon="bag-handle-outline" value={orderOverview.noOfOrder} label="Orders" />
            <Overview icon="wallet-outline" value={orderOverview.totalCost} label="Total cost" />
            <Overview icon="close-circle-outline" value={orderOverview.cancel} label="Cancelled" />
            <Overview icon="return-down-back-outline" value={orderOverview.returnAmt} label="Returns" />
          </View>
        </SectionCard>

        <SectionCard title="Top selling" right={<Chip text="Today" />} index={6}>
          {topSellingDishes.map((d, i) => (
            <View
              key={d.id}
              style={[styles.dishRow, i === topSellingDishes.length - 1 && { borderBottomWidth: 0 }]}
            >
              <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dishRing}>
                <View style={styles.dishIcon}>
                  <Icon name={d.icon} size={20} color={colors.text} />
                </View>
              </LinearGradient>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.dishName}>{d.name}</Text>
                <Text style={styles.dishOrders}>{d.orders} orders</Text>
              </View>
              <Text style={styles.dishProfit}>{d.profit}</Text>
            </View>
          ))}
        </SectionCard>

        <SectionCard title="Sales & purchase" right={<Chip text="Weekly" icon="calendar-outline" />} index={7}>
          <BarChart data={salesPurchaseData} />
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function Chip({ text, icon }) {
  return (
    <View style={styles.chip}>
      {icon ? <Icon name={icon} size={13} color={colors.text} /> : null}
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Overview({ icon, value, label }) {
  return (
    <View style={styles.overviewItem}>
      <View style={styles.overviewIcon}>
        <Icon name={icon} size={20} color={colors.text} />
      </View>
      <Text style={styles.overviewValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  hello: { marginTop: spacing.sm },
  helloSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },

  shortcutsScroller: { marginHorizontal: -spacing.lg, marginVertical: spacing.xl },
  shortcuts: { paddingHorizontal: spacing.lg, gap: spacing.md },
  shortcut: { width: 84, alignItems: 'center' },
  shortcutTile: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: { color: colors.text, fontSize: 13, fontWeight: '500', marginTop: spacing.sm },

  hero: { padding: 24, minHeight: 250, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  heroMeta: { color: colors.inkMuted, fontSize: 13, marginTop: 1 },
  heroValue: { fontSize: 64, lineHeight: 68, letterSpacing: -3, marginTop: spacing.xxl },
  heroDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  heroDeltaText: { color: colors.text, fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },

  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewItem: { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
  overviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.elevated3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  overviewValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  overviewLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.elevated3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.text },

  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dishRing: { width: 48, height: 48, borderRadius: 24, padding: 2 },
  dishIcon: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishName: { fontSize: 15, fontWeight: '600', color: colors.text },
  dishOrders: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dishProfit: { fontSize: 14, fontWeight: '700', color: colors.success },
});
