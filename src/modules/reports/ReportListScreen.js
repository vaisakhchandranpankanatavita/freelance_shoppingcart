import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import DateField from '../../components/DateField';
import SegmentedControl from '../../components/SegmentedControl';
import SummaryTiles from '../../components/SummaryTiles';
import BarListChart from '../../components/BarListChart';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, shadows } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { plural } from '../../utils/format';
import { REPORTS, toReportRows } from './reports';

const pad = (n) => String(n).padStart(2, '0');
const toIso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// `fromdate`/`todate` are required on every call (see reports.js) — default to "this month so
// far" instead of blank, so the report has a valid range to run on the very first load.
const defaultFrom = () => { const d = new Date(); d.setDate(1); return toIso(d); };
const defaultTo = () => toIso(new Date());

// Generic read-only list for any report in ./reports.js: optional from/to date filter, a count
// tile up top, then one row per record (primary line, optional secondary line, optional
// right-aligned value) — same card layout as StockLedgerScreen.js.
export default function ReportListScreen({ navigation, route }) {
  const config = REPORTS[route.params.reportKey];
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [view, setView] = useState('list');
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  const load = async () => {
    try {
      const res = await config.api(config.dateFilter ? { from, to } : undefined);
      setRows(toReportRows(res, config.mapRow));
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [from, to]));

  // ISO 'YYYY-MM-DD' strings sort lexicographically the same as chronologically, so plain string
  // comparison is enough here. Keeps `to` >= `from` client-side — a live 422 confirmed the
  // backend rejects the inverted range outright ("todate must be a date after or equal to
  // fromdate") instead of just swapping or ignoring it.
  const onChangeFrom = (v) => {
    setFrom(v);
    setTo((t) => (t < v ? v : t));
  };
  const onChangeTo = (v) => {
    setTo(v);
    setFrom((f) => (v < f ? v : f));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const header = (
    <>
      <SummaryTiles tiles={[{ value: rows.length, label: plural(rows.length, 'record'), tone: 'light' }]} />
      {config.dateFilter ? (
        <Animated.View entering={enter(2)} style={styles.filterRow}>
          <DateField style={styles.filterCell} label="From" value={from} onChange={onChangeFrom} />
          <DateField style={styles.filterCell} label="To" value={to} onChange={onChangeTo} />
        </Animated.View>
      ) : null}
      {config.chartable ? (
        <SegmentedControl
          style={styles.viewToggle}
          compact
          options={[{ key: 'list', label: 'List', icon: 'list-outline' }, { key: 'chart', label: 'Chart', icon: 'bar-chart-outline' }]}
          value={view}
          onChange={setView}
        />
      ) : null}
    </>
  );

  const showChart = config.chartable && view === 'chart';

  // The chart needs every row's numeric value up front (to scale bar widths against the max),
  // so it can't reuse FlatList's per-row renderItem — it's a separate scroll branch below.
  const chartData = showChart
    ? rows
      .filter((r) => r.chartValue != null)
      .map((r) => ({ id: r.id, label: r.primary, sublabel: r.secondary, value: r.chartValue, format: r.chartFormat ?? config.chartFormat }))
    : [];

  return (
    <Screen header={<ScreenHeader title={config.title} onBack={() => navigation.goBack()} />}>
      {showChart ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        >
          {header}
          {!loaded ? null : error ? (
            <EmptyState tone="error" icon="cloud-offline-outline" title={`Can't load ${config.title.toLowerCase()}`} message={error} actionLabel="Try again" onAction={onRefresh} />
          ) : chartData.length ? (
            <BarListChart data={chartData} format={config.chartFormat} />
          ) : (
            <EmptyState icon={config.emptyIcon} title="No records" message="Nothing to show for this period." />
          )}
        </ScrollView>
      ) : (
        <Animated.FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          itemLayoutAnimation={layout}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={enter(index + 3)} exiting={fadeOut} style={styles.card}>
              <View style={styles.iconWrap}>
                <Icon name={config.icon} size={16} color={colors.text} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name} numberOfLines={1}>{item.primary}</Text>
                {item.secondary ? <Text style={styles.sub} numberOfLines={1}>{item.secondary}</Text> : null}
              </View>
              {item.value != null ? <Text style={styles.value} numberOfLines={1}>{item.value}</Text> : null}
            </Animated.View>
          )}
          ListEmptyComponent={
            !loaded ? null : error ? (
              <EmptyState tone="error" icon="cloud-offline-outline" title={`Can't load ${config.title.toLowerCase()}`} message={error} actionLabel="Try again" onAction={onRefresh} />
            ) : (
              <EmptyState icon={config.emptyIcon} title="No records" message="Nothing to show for this period." />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: spacing.xl },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  filterCell: { flex: 1 },
  viewToggle: {
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chip,
  },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  value: { fontSize: 14, fontWeight: '700', color: colors.text },
});
