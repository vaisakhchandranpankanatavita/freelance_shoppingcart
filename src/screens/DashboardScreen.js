import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import { HEADER_HEIGHT_LARGE_NO_BACK } from '../components/ScreenHeader';
import PressableScale from '../components/PressableScale';
import MetricCard from '../components/MetricCard';
import EmptyState from '../components/EmptyState';
import StackedList from '../components/StackedList';
import Waveform from '../components/Waveform';
import { GlassCard } from '../components/Glass';
import { DataTable, DonutChart, HealthBar } from '../components/DashboardWidgets';
import { useTabBarClearance } from '../components/TabBar';
import { colors, radius, spacing, fonts, tones } from '../theme';
import { enter } from '../theme/motion';
import { getDashboard } from '../modules/dashboard/services';

// Gap between snapped carousel cards — pulled from the spacing scale, not a one-off number.
const GAP = spacing.sm;

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
  const allMetrics = data?.metrics ?? [];
  // Stock value carries the most weight of any figure here, so it leads the screen as a hero
  // rather than sitting shoulder-to-shoulder with five equal-sized cards in the carousel.
  const hero = allMetrics.find((m) => m.key === 'value') ?? null;
  const metrics = allMetrics.filter((m) => m.key !== 'value');
  const tabClearance = useTabBarClearance();

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
      {/* Title/menu icon now live in AppHeader.js, rendered once at the tab-navigator level so
          it stays fixed across tab switches instead of remounting with this screen. */}
      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabClearance + spacing.lg }]}
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

        {hero ? (
          <Animated.View entering={enter(1)} style={styles.heroWrap}>
            <PressableScale onPress={() => navigation.navigate(...hero.to)} accessibilityLabel={`${hero.title}: ${hero.value}. Open stock`}>
              <GlassCard style={styles.hero}>
                <Text style={[styles.heroLabel, styles.onCard]}>{hero.title}</Text>
                <View style={styles.heroFigure}>
                  <Text style={styles.heroValue}>{hero.value}</Text>
                  <View style={[styles.heroBadge, { borderColor: tones[hero.tone][1] }]}>
                    <Icon name={hero.icon} size={17} color={tones[hero.tone][1]} />
                  </View>
                </View>
                <Text style={styles.heroSubtitle}>{hero.subtitle}</Text>
                <Waveform from={tones[hero.tone][0]} to={tones[hero.tone][1]} seed={1} height={36} style={styles.heroWave} />
              </GlassCard>
            </PressableScale>
          </Animated.View>
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

        {data?.lowStock.length ? (
          <>
            <Animated.Text entering={enter(3)} style={[styles.sectionTitle, styles.section]}>
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
                    <Text style={styles.productMeta} numberOfLines={1}>{d.category}</Text>
                  </View>
                  <Text style={styles.lowQty} numberOfLines={1}>{d.qty > 0 ? `${d.qty} ${d.unit} left` : 'Out of stock'}</Text>
                </>
              )}
            />
          </>
        ) : null}

        {data?.insights ? (
          <Animated.View entering={enter(4)} style={styles.panelWrap}>
            <GlassCard style={styles.panel}>
              <Text style={[styles.sectionTitle, styles.onCard]}>Stock composition</Text>
              <HealthBar
                parts={[
                  { label: 'In stock', value: data.insights.health.ok, color: colors.green },
                  { label: 'Low', value: data.insights.health.low, color: colors.warning },
                  { label: 'Out', value: data.insights.health.out, color: colors.danger },
                ]}
              />
              {data.insights.share.length > 1 ? (
                <>
                  <View style={styles.panelDivider} />
                  <Text style={styles.subsectionTitle}>Where the value sits</Text>
                  <DonutChart
                    data={data.insights.share}
                    total={data.insights.totalValue}
                    centreLabel="total value"
                    format={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(1)}K`)}
                  />
                </>
              ) : null}
              {data.insights.table.length > 1 ? (
                <>
                  <View style={styles.panelDivider} />
                  <Text style={styles.subsectionTitle}>Category breakdown</Text>
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
            </GlassCard>
          </Animated.View>
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
                    <Text style={styles.productMeta} numberOfLines={1}>{d.qty.toLocaleString('en-IN')} {d.unit} in stock</Text>
                  </View>
                  <Text style={styles.productProfit} numberOfLines={1}>{rupees(d.qty * d.price)}</Text>
                </>
              )}
            />
          </>
        ) : null}
      </Animated.ScrollView>
    </Screen>
  );
}

// Two-tier rhythm: SECTION_GAP separates one block from the next (hero, carousel, each list,
// the composition panel); INNER_GAP separates a block's own title from its content, and one
// piece of a panel from the next (divider → subsection). Keeping inner gaps tighter than outer
// ones is what makes the hierarchy — and the page — read as compact rather than just smaller.
const SECTION_GAP = spacing.lg;
const INNER_GAP = spacing.md;

const styles = StyleSheet.create({
  // Quick actions moved to a global floating trigger (QuickActionsSheet.js, rendered once
  // alongside the tab bar) — this screen only needs to clear the floating tab bar itself now
  // (handled via tabClearance above), not the old extra Quick actions row.
  scroll: { paddingTop: HEADER_HEIGHT_LARGE_NO_BACK },

  // The one figure the owner checks first — full width, leading the screen, so it reads as
  // the dashboard's hero rather than one tile among several equal-weight metric cards.
  heroWrap: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
  hero: { padding: spacing.lg, borderRadius: radius.lg },
  heroLabel: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.inkMuted },
  heroFigure: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xs },
  heroValue: { color: colors.ink, fontSize: 40, fontFamily: fonts.display, letterSpacing: -1.2 },
  heroBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs / 2,
  },
  heroSubtitle: { color: colors.inkMuted, fontSize: 13, marginTop: spacing.xs },
  heroWave: { marginTop: spacing.sm, marginHorizontal: spacing.xs / 2 },

  carousel: { marginTop: SECTION_GAP },
  carouselContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs / 2, gap: GAP },
  carouselPlaceholder: { height: 130, marginTop: SECTION_GAP },

  section: { paddingHorizontal: spacing.lg, marginTop: SECTION_GAP },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  subsectionTitle: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.inkMuted },
  onCard: { color: colors.ink },
  toggle: { width: 128 },
  panelWrap: { marginHorizontal: spacing.lg, marginTop: SECTION_GAP },
  panel: { padding: INNER_GAP, borderRadius: radius.md },
  panelDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.inkLine, marginVertical: INNER_GAP },

  lowIcon: { borderColor: colors.danger },
  lowQty: { color: colors.dangerStrong, fontSize: 13, fontFamily: fonts.bodyBold },

  productIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.greenStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { color: colors.text, fontSize: 14, fontFamily: fonts.bodySemiBold },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs / 2 },
  productProfit: { color: colors.greenStrong, fontSize: 14, fontFamily: fonts.bodyBold },
});
