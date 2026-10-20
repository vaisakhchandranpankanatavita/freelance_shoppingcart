import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import { HEADER_HEIGHT_LARGE_NO_BACK } from '../components/ScreenHeader';
import PressableScale from '../components/PressableScale';
import EmptyState from '../components/EmptyState';
import { GlassCard } from '../components/Glass';
import { DataTable, GrowBar, PALETTE as CHART_PALETTE } from '../components/DashboardWidgets';
import Waveform from '../components/Waveform';
import { RevenueTrend, PeakHours, MonthlyBills } from '../components/DashboardCharts';
import { useTabBarClearance } from '../components/TabBar';
import useTween from '../hooks/useTween';
import { colors, chartPalette, radius, spacing, fonts, tones } from '../theme';
import { enter } from '../theme/motion';
import { getDashboard } from '../modules/dashboard/services';
import { rupees, rupeesShort } from '../utils/format';

const GAP = spacing.sm;
const KPI_KEYS = ['bills', 'customers', 'value'];
const RING = 84;
const STROKE = 10;
const PALETTE = [chartPalette.sage, chartPalette.mint, chartPalette.mustard, chartPalette.coral, chartPalette.violet, chartPalette.slate];

// Number that counts up from 0 when it first appears; strings (e.g. ₹1.2L) pass through.
function CountUp({ value, style, ...rest }) {
  const t = useTween(typeof value === 'number' ? value : 0, { duration: 900, from: 0 });
  return <Text style={style} {...rest}>{typeof value === 'number' ? Math.round(t).toLocaleString('en-IN') : value}</Text>;
}

// Vertical columns that rise together, one per category, value on top.
function ColumnChart({ rows }) {
  const peak = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View style={styles.cols}>
      {rows.map((r, i) => (
        <View key={r.id} style={styles.colWrap}>
          <Text style={styles.colVal} numberOfLines={1}>{rupeesShort(r.value)}</Text>
          <View style={styles.colTrack}>
            <Col pct={(r.value / peak) * 100} color={CHART_PALETTE[i % CHART_PALETTE.length]} delay={i * 110} />
          </View>
          <Text style={styles.colName} numberOfLines={1}>{r.category}</Text>
        </View>
      ))}
    </View>
  );
}

function Col({ pct, color, delay }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, []);
  const st = useAnimatedStyle(() => ({ height: `${Math.max(4, pct) * p.value}%` }));
  return <Animated.View style={[styles.col, { backgroundColor: color }, st]} />;
}

const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN') : v);

// Headline figure — big number, label above, unit below. Tappable.
function KpiTile({ metric, onPress }) {
  const [, to] = tones[metric.tone];
  const counted = useTween(typeof metric.value === 'number' ? metric.value : 0, { duration: 900, from: 0 });
  const shown = typeof metric.value === 'number' ? Math.round(counted).toLocaleString('en-IN') : metric.value;
  return (
    <PressableScale style={styles.flex1} onPress={onPress} accessibilityLabel={`${metric.title}: ${fmt(metric.value)}. Open details`}>
      <GlassCard style={styles.kpi}>
        <View style={styles.kpiTop}>
          <Text style={styles.kpiLabel} numberOfLines={1}>{metric.title}</Text>
          <Icon name={metric.icon} size={14} color={to} />
        </View>
        <CountUp value={metric.value} style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit />
        <Waveform from={tones[metric.tone][0]} to={to} seed={metric.key.length + 1} height={16} bars={13} style={styles.kpiWave} />
        <Text style={styles.kpiUnit} numberOfLines={1}>{metric.unit || 'AT SELLING PRICE'}</Text>
      </GlassCard>
    </PressableScale>
  );
}

// Secondary metric — small icon chip, value and title in one compact tile.
function MiniTile({ metric, onPress }) {
  const [, to] = tones[metric.tone];
  return (
    <PressableScale style={styles.mini} onPress={onPress} accessibilityLabel={`${metric.title}: ${fmt(metric.value)} ${metric.unit}. Open details`}>
      <GlassCard style={styles.miniCard}>
        <View style={[styles.miniBadge, { borderColor: to }]}>
          <Icon name={metric.icon} size={13} color={to} />
        </View>
        <View style={styles.miniText}>
          <CountUp value={metric.value} style={styles.miniValue} numberOfLines={1} />
          <Text style={styles.miniTitle} numberOfLines={1}>{metric.title}</Text>
        </View>
      </GlassCard>
    </PressableScale>
  );
}

// Ring: one arc per slice sweeping in together, centre label.
function Ring({ slices, centre, caption }) {
  const sweep = useTween(1, { duration: 1000, from: 0 });
  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const sum = slices.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  return (
    <View style={{ width: RING, height: RING }}>
      <Svg width={RING} height={RING} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={colors.inkLine} strokeWidth={STROKE} fill="none" />
        {slices.map((d) => {
          const len = (d.value / sum) * c * sweep;
          const gap = slices.length > 1 ? 2 : 0;
          const el = (
            <Circle
              key={d.label}
              cx={RING / 2}
              cy={RING / 2}
              r={r}
              stroke={d.color}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
              strokeDashoffset={-offset * sweep}
            />
          );
          offset += (d.value / sum) * c;
          return el;
        })}
      </Svg>
      <View style={styles.ringCentre} pointerEvents="none">
        <Text style={styles.ringValue}>{centre}</Text>
        <Text style={styles.ringCaption}>{caption}</Text>
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendName} numberOfLines={1}>{label}</Text>
      <Text style={styles.legendVal}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
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
  const tabClearance = useTabBarClearance();

  const all = data?.metrics ?? [];
  const kpis = KPI_KEYS.map((k) => all.find((m) => m.key === k)).filter(Boolean);
  const minis = all.filter((m) => !KPI_KEYS.includes(m.key));
  const go = (m) => navigation.navigate(...m.to);
  const lowMetric = all.find((m) => m.key === 'low');
  const lowCount = data?.lowStock.length ? lowMetric?.value ?? data.lowStock.length : 0;
  const insights = data?.insights;
  const topPeak = Math.max(...(data?.topStocked ?? []).map((d) => d.qty * d.price), 1);
  const health = insights?.health;
  const healthTotal = health ? health.ok + health.low + health.out : 0;
  const okPct = healthTotal ? Math.round((health.ok / healthTotal) * 100) : 0;
  const shareSum = insights?.share.reduce((s, d) => s + d.value, 0) || 1;
  const shareSlices = (insights?.share ?? []).map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));
  const healthSlices = health
    ? [
        { label: 'In stock', value: health.ok, color: colors.green },
        { label: 'Low', value: health.low, color: colors.warning },
        { label: 'Out', value: health.out, color: colors.danger },
      ]
    : [];

  return (
    <Screen>
      {/* Title/menu icon live in AppHeader.js and the dock in TabBar.js, both rendered once at
          the tab-navigator level — untouched by this screen. */}
      <Animated.ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabClearance + spacing.lg }]}
        showsVerticalScrollIndicator={false}
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

        {kpis.length ? (
          <Animated.View entering={enter(1)} style={[styles.row, styles.first]}>
            {kpis.map((m) => (
              <KpiTile key={m.key} metric={m} onPress={() => go(m)} />
            ))}
          </Animated.View>
        ) : null}

        {minis.length ? (
          <Animated.View entering={enter(2)} style={[styles.wrap, styles.block]}>
            {minis.map((m) => (
              <MiniTile key={m.key} metric={m} onPress={() => go(m)} />
            ))}
          </Animated.View>
        ) : null}

        {data?.trends?.revenue.length > 1 ? (
          <Animated.View entering={enter(3)} style={styles.block}>
            <GlassCard style={styles.panel}>
              <Text style={styles.panelLabel}>Revenue trend</Text>
              <View style={styles.chartBody}>
                <RevenueTrend data={data.trends.revenue} />
              </View>
            </GlassCard>
          </Animated.View>
        ) : null}

        {data?.trends?.peakHours.length === 24 || data?.trends?.monthly ? (
          <Animated.View entering={enter(3)} style={[styles.row, styles.block]}>
            {data.trends.peakHours.length === 24 ? (
              <View style={styles.flex1}>
                <GlassCard style={styles.panel}>
                  <Text style={styles.panelLabel}>Peak hours</Text>
                  <View style={styles.chartBody}>
                    <PeakHours data={data.trends.peakHours} />
                  </View>
                </GlassCard>
              </View>
            ) : null}
          </Animated.View>
        ) : null}

        {data?.trends?.monthly ? (
          <Animated.View entering={enter(3)} style={styles.block}>
            <GlassCard style={styles.panel}>
              <Text style={styles.panelLabel}>Bills by month</Text>
              <View style={styles.chartBody}>
                <MonthlyBills monthly={data.trends.monthly} />
              </View>
            </GlassCard>
          </Animated.View>
        ) : null}

        {data?.lowStock.length ? (
          <Animated.View entering={enter(3)} style={styles.block}>
            <View style={styles.alert}>
              <PressableScale onPress={() => navigation.navigate('Stock')} accessibilityLabel={`${lowCount} items need restocking. Open stock`}>
                <View style={styles.alertHead}>
                  <Icon name="alert-circle-outline" size={18} color={colors.danger} />
                  <Text style={styles.alertTitle}>{lowCount} {lowCount === 1 ? 'item needs' : 'items need'} restocking</Text>
                  <View style={styles.alertCta}>
                    <Text style={styles.alertCtaText}>RESTOCK</Text>
                  </View>
                </View>
              </PressableScale>
              {data.lowStock.map((d) => (
                <View key={d.id} style={styles.alertRow}>
                  <Text style={styles.alertName} numberOfLines={1}>{d.name}</Text>
                  <Text style={styles.alertCat} numberOfLines={1}>{d.category}</Text>
                  <Text style={styles.alertQty} numberOfLines={1}>{d.qty > 0 ? `${d.qty} ${d.unit} left` : 'Out of stock'}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {insights ? (
          <>
            <Animated.View entering={enter(4)} style={[styles.row, styles.block]}>
              {(() => {
                const split = insights.share.length > 1;
                return (
                  <>
                    <View style={styles.flex1}>
                      <GlassCard style={styles.panel}>
                        <Text style={styles.panelLabel}>Stock health</Text>
                        <View style={split ? styles.panelBody : styles.panelBodyWide}>
                          <Ring slices={healthSlices} centre={`${okPct}%`} caption={okPct >= 70 ? 'OPTIMAL' : 'WATCH'} />
                          {!split ? (
                            <View style={[styles.legend, styles.flex1]}>
                              {healthSlices.map((d) => (
                                <LegendRow key={d.label} color={d.color} label={d.label} value={d.value} />
                              ))}
                            </View>
                          ) : null}
                        </View>
                        {split ? (
                          <View style={styles.legend}>
                            {healthSlices.map((d) => (
                              <LegendRow key={d.label} color={d.color} label={d.label} value={d.value} />
                            ))}
                          </View>
                        ) : null}
                      </GlassCard>
                    </View>
                    {split ? (
                      <View style={styles.flex1}>
                        <GlassCard style={styles.panel}>
                          <Text style={styles.panelLabel}>Where the value sits</Text>
                          <View style={styles.panelBody}>
                            <Ring slices={shareSlices} centre={rupeesShort(insights.totalValue)} caption="TOTAL" />
                          </View>
                          <View style={styles.legend}>
                            {shareSlices.slice(0, 3).map((d) => (
                              <LegendRow key={d.label} color={d.color} label={d.label} value={`${Math.round((d.value / shareSum) * 100)}%`} />
                            ))}
                          </View>
                        </GlassCard>
                      </View>
                    ) : null}
                  </>
                );
              })()}
            </Animated.View>

            {insights.table.length > 1 ? (
              <Animated.View entering={enter(5)} style={styles.block}>
                <Text style={styles.sectionTitle}>Category breakdown</Text>
                <GlassCard style={[styles.panel, styles.chartCard]}>
                  <Text style={styles.panelLabel}>Stock value by category</Text>
                  <ColumnChart rows={insights.table} />
                </GlassCard>
                <View style={styles.sectionBody}>
                  <DataTable
                    columns={[
                      { key: 'category', title: 'Category', flex: 1.4, strong: true },
                      { key: 'items', title: 'Items', flex: 0.6, align: 'right' },
                      { key: 'units', title: 'Units', flex: 0.7, align: 'right', render: (v) => Math.round(v).toLocaleString('en-IN') },
                      { key: 'value', title: 'Value', flex: 1.2, align: 'right', bar: true, render: (v) => rupees(v) },
                    ]}
                    rows={insights.table}
                  />
                </View>
              </Animated.View>
            ) : null}
          </>
        ) : null}

        {data?.topStocked.length ? (
          <Animated.View entering={enter(6)} style={styles.block}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Most stock value</Text>
              <PressableScale onPress={() => navigation.navigate('Stock')} accessibilityLabel="View all stock">
                <Text style={styles.viewAll}>View all</Text>
              </PressableScale>
            </View>
            <GlassCard style={styles.table}>
              {data.topStocked.map((d, i) => (
                <View key={d.id} style={[styles.tr, i === data.topStocked.length - 1 && styles.trLast]}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={styles.flex1}>
                    <Text style={styles.itemName} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.itemMeta} numberOfLines={1}>{d.qty.toLocaleString('en-IN')} {d.unit} · {d.category}</Text>
                    <View style={styles.itemTrack}>
                      <GrowBar pct={(d.qty * d.price / topPeak) * 100} color={CHART_PALETTE[i % CHART_PALETTE.length]} delay={i * 90} />
                    </View>
                  </View>
                  <Text style={styles.itemValue} numberOfLines={1}>{rupees(d.qty * d.price)}</Text>
                </View>
              ))}
            </GlassCard>
          </Animated.View>
        ) : null}
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: HEADER_HEIGHT_LARGE_NO_BACK },
  flex1: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', gap: GAP },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  first: { marginHorizontal: spacing.lg, marginTop: spacing.xs },
  block: { marginHorizontal: spacing.lg, marginTop: GAP },

  kpi: { padding: spacing.md, borderRadius: radius.lg },
  kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiLabel: { flex: 1, color: colors.inkMuted, fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase' },
  kpiValue: { color: colors.ink, fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.6, marginTop: spacing.xs },
  kpiWave: { marginVertical: 3 },
  kpiUnit: { color: colors.accent, fontSize: 9, fontFamily: fonts.bodyBold, letterSpacing: 0.6 },

  // three per row: (container - 2 gaps) / 3
  mini: { width: '31.9%', flexGrow: 1 },
  miniCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
  miniBadge: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  miniText: { flex: 1, minWidth: 0 },
  miniValue: { color: colors.ink, fontSize: 14, fontFamily: fonts.bodyBold },
  miniTitle: { color: colors.inkMuted, fontSize: 10, fontFamily: fonts.bodySemiBold },

  alert: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(242,72,78,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(242,72,78,0.2)',
  },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.xs },
  alertTitle: { flex: 1, color: colors.ink, fontSize: 13, fontFamily: fonts.bodyBold },
  alertCta: { backgroundColor: colors.danger, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  alertCtaText: { color: '#FFFFFF', fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 0.4 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(242,72,78,0.2)',
  },
  alertName: { flex: 1.3, color: colors.ink, fontSize: 12, fontFamily: fonts.bodySemiBold },
  alertCat: { flex: 1, color: colors.inkMuted, fontSize: 11 },
  alertQty: { color: colors.dangerStrong, fontSize: 11, fontFamily: fonts.bodyBold },

  panel: { padding: spacing.md, borderRadius: radius.lg },
  panelLabel: { color: colors.inkMuted, fontSize: 10, fontFamily: fonts.bodyBold, letterSpacing: 0.6, textTransform: 'uppercase' },
  chartBody: { marginTop: spacing.sm },
  panelBody: { alignItems: 'center', marginVertical: spacing.sm },
  panelBodyWide: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.sm },
  ringCentre: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringValue: { color: colors.ink, fontSize: 17, fontFamily: fonts.display, letterSpacing: -0.4 },
  ringCaption: { color: colors.inkMuted, fontSize: 8, fontFamily: fonts.bodyBold, letterSpacing: 0.5 },
  legend: { gap: 5 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendName: { flex: 1, color: colors.ink, fontSize: 12, fontFamily: fonts.bodySemiBold },
  legendVal: { color: colors.inkMuted, fontSize: 12, fontFamily: fonts.bodyBold },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  chartCard: { marginTop: spacing.xs },
  cols: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, height: 118, marginTop: spacing.sm },
  colWrap: { flex: 1, height: '100%', alignItems: 'center' },
  colVal: { color: colors.ink, fontSize: 10, fontFamily: fonts.bodyBold },
  colTrack: { flex: 1, width: '70%', justifyContent: 'flex-end', marginVertical: 3 },
  col: { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  colName: { color: colors.inkMuted, fontSize: 10, fontFamily: fonts.bodySemiBold },
  itemTrack: { height: 3, borderRadius: 2, backgroundColor: colors.elevated3, marginTop: 4, overflow: 'hidden' },
  sectionBody: { marginTop: spacing.xs },
  viewAll: { color: colors.accent, fontSize: 12, fontFamily: fonts.bodyBold },

  table: { borderRadius: radius.lg, marginTop: spacing.xs },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.inkLine,
  },
  trLast: { borderBottomWidth: 0 },
  rank: { width: 16, color: colors.textFaint, fontSize: 12, fontFamily: fonts.bodyBold },
  itemName: { color: colors.ink, fontSize: 13, fontFamily: fonts.bodyBold },
  itemMeta: { color: colors.inkMuted, fontSize: 10, marginTop: 1 },
  itemValue: { color: colors.greenStrong, fontSize: 13, fontFamily: fonts.bodyBold },
});
