import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import EmptyState from '../components/EmptyState';
import ActionPicker from '../components/ActionPicker';
import StackedList from '../components/StackedList';
import { DataTable, DonutChart, HealthBar } from '../components/DashboardWidgets';
import { GlassEdge } from '../components/Glass';
import { colors, radius, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';
import { getDashboard } from '../modules/dashboard/services';

const GAP = 12;

// `initial: false` keeps each stack's list screen underneath so Back behaves naturally.
const SHORTCUTS = [
  { key: 'sale', label: 'New bill', icon: 'receipt-outline', tab: 'Sale', screen: 'NewSale' },
  { key: 'stock', label: 'Add stock', icon: 'cube-outline', tab: 'Stock', screen: 'AddStock' },
  { key: 'po', label: 'New PO', icon: 'cart-outline', tab: 'Purchase', screen: 'AddPurchase' },
  { key: 'sales', label: 'Sales', icon: 'pricetag-outline', tab: 'Sale' },
  { key: 'branches', label: 'Branches', icon: 'business-outline', tab: 'More', screen: 'EntityList', params: { entity: 'branch' } },
  { key: 'categories', label: 'Categories', icon: 'albums-outline', tab: 'More', screen: 'EntityList', params: { entity: 'category' } },
  { key: 'suppliers', label: 'Suppliers', icon: 'people-outline', tab: 'More', screen: 'EntityList', params: { entity: 'supplier' } },
  { key: 'shop', label: 'Store', icon: 'storefront-outline', tab: 'More', screen: 'EntityForm', params: { entity: 'shop' } },
];

const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function DashboardScreen({ navigation }) {
  const [width, setWidth] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setData(await getDashboard());
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };
  const metrics = data?.metrics ?? [];

  // Two cards fit exactly inside the screen margins, snapping card by card.
  const cardW = width ? (width - spacing.lg * 2 - GAP) / 2 : 0;
  const interval = cardW + GAP;
  const scrollX = useSharedValue(0);
  const carouselRef = useRef(null);

  // Web has no touch: let the mouse drag the carousel and snap to a card on release
  // (the native snapToInterval prop is ignored by react-native-web).
  useEffect(() => {
    if (Platform.OS !== 'web' || !cardW) return;
    const ref = carouselRef.current;
    const el = ref?.getScrollableNode?.() ?? ref;
    if (!el?.addEventListener) return;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    const move = (e) => {
      if (dragging) el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      el.style.scrollSnapType = '';
      el.scrollTo({ left: Math.round(el.scrollLeft / interval) * interval, behavior: 'smooth' });
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    const down = (e) => {
      dragging = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    };
    el.addEventListener('mousedown', down);
    return () => {
      el.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [cardW, interval]);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  return (
    <Screen>
      {/* Top bar sits outside the scroll view so it stays pinned while the content moves. */}
      <Animated.View entering={enter(0)} style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">
            Store Dashboard
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('More')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Menu"
        >
          <Icon name="reorder-two-outline" size={28} color={colors.text} />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentStrong} />}
      >
        {error && !data ? (
          <EmptyState
            tone="error"
            icon="cloud-offline-outline"
            title="Couldn't load the dashboard"
            message={error}
            actionLabel="Try again"
            onAction={load}
          />
        ) : null}

        {cardW && metrics.length ? (
          <Animated.ScrollView
            ref={carouselRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={interval}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.carousel}
            contentContainerStyle={styles.carouselContent}
          >
            {metrics.map((m, i) => (
              <Animated.View key={m.key} entering={enter(i + 1)}>
                <MetricCard
                  metric={m}
                  index={i}
                  width={cardW}
                  interval={interval}
                  scrollX={scrollX}
                  onPress={() => navigation.navigate(...m.to)}
                />
              </Animated.View>
            ))}
          </Animated.ScrollView>
        ) : !error ? (
          <View style={styles.carouselPlaceholder} />
        ) : null}

        {data?.chart ? (
          <Animated.View entering={enter(3)} style={styles.panel}>
            <Text style={[styles.sectionTitle, styles.onCard]}>Stock value by category</Text>
            <View style={styles.chart}>
              <LineChart
                series={data.chart.series}
                max={data.chart.max}
                ticks={data.chart.ticks}
                format={(v) => `₹${v.toFixed(1)}K`}
                initialIndex={0}
                height={140}
              />
            </View>
          </Animated.View>
        ) : null}

        {data?.insights ? (
          <>
            <Animated.View entering={enter(4)} style={styles.panel}>
              <Text style={[styles.sectionTitle, styles.onCard]}>Stock health</Text>
              <HealthBar
                parts={[
                  { label: 'In stock', value: data.insights.health.ok, color: colors.green },
                  { label: 'Low', value: data.insights.health.low, color: colors.warning },
                  { label: 'Out', value: data.insights.health.out, color: colors.danger },
                ]}
              />
            </Animated.View>
            {data.insights.share.length > 1 ? (
              <Animated.View entering={enter(5)} style={styles.panel}>
                <Text style={[styles.sectionTitle, styles.onCard]}>Where your stock value sits</Text>
                <DonutChart
                  data={data.insights.share}
                  total={data.insights.totalValue}
                  centreLabel="total value"
                  format={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(1)}K`)}
                />
              </Animated.View>
            ) : null}
          </>
        ) : null}

        <Animated.Text entering={enter(5)} style={[styles.sectionTitle, styles.section]}>
          Quick actions
        </Animated.Text>
        <ActionPicker
          actions={SHORTCUTS}
          onOpen={(s) =>
            navigation.navigate(s.tab, s.screen ? { screen: s.screen, params: s.params, initial: false } : undefined)
          }
        />

        {data?.lowStock.length ? (
          <>
            <Animated.Text entering={enter(7)} style={[styles.sectionTitle, styles.section]}>
              Needs restocking
            </Animated.Text>
            <StackedList
              items={data.lowStock}
              keyExtractor={(d) => d.id}
              label="items needing restock"
              renderItem={(d) => (
                <>
                  <View style={[styles.productIcon, styles.lowIcon]}>
                    <Icon name="alert-circle-outline" size={20} color={colors.danger} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.productName} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.productMeta}>{d.category}</Text>
                  </View>
                  <Text style={styles.lowQty}>{d.qty} {d.unit} left</Text>
                </>
              )}
            />
          </>
        ) : null}

        {data?.topStocked.length ? (
          <>
            <Animated.Text entering={enter(8)} style={[styles.sectionTitle, styles.section]}>
              Most stock value
            </Animated.Text>
            <StackedList
              items={data.topStocked}
              keyExtractor={(d) => d.id}
              label="top stocked items"
              renderItem={(d) => (
                <>
                  <View style={styles.productIcon}>
                    <Icon name="basket-outline" size={20} color={colors.greenStrong} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.productName} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.productMeta}>{d.qty.toLocaleString('en-IN')} {d.unit} in stock</Text>
                  </View>
                  <Text style={styles.productProfit}>{rupees(d.qty * d.price)}</Text>
                </>
              )}
            />
          </>
        ) : null}
        {data?.insights?.table.length ? (
          <>
            <Animated.Text entering={enter(10)} style={[styles.sectionTitle, styles.section]}>
              Category breakdown
            </Animated.Text>
            <DataTable
              columns={[
                { key: 'category', title: 'Category', flex: 1.4, strong: true },
                { key: 'items', title: 'Items', flex: 0.6, align: 'right' },
                { key: 'units', title: 'Units', flex: 0.7, align: 'right', render: (v) => Math.round(v).toLocaleString('en-IN') },
                { key: 'value', title: 'Value', flex: 1.2, align: 'right', bar: true, render: (v) => rupees(v) },
              ]}
              rows={data.insights.table}
            />
          </>
        ) : null}
      </Animated.ScrollView>
      <GlassEdge />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 96 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: { color: colors.text, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.5 },

  carousel: { marginTop: spacing.md },
  carouselContent: { paddingHorizontal: spacing.lg, paddingVertical: 4, gap: GAP },
  carouselPlaceholder: { height: 150, marginTop: spacing.md },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  onCard: { color: colors.ink },
  toggle: { width: 128 },
  panel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  chart: { marginTop: spacing.sm },

  lowIcon: { borderColor: colors.danger },
  lowQty: { color: colors.danger, fontSize: 13, fontWeight: '700' },

  productIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.greenStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  productProfit: { color: colors.greenStrong, fontSize: 14, fontWeight: '700' },
});
