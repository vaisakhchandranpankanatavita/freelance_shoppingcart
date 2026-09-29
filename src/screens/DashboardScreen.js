import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import Icon from '../components/Icon';
import Screen from '../components/Screen';
import PressableScale from '../components/PressableScale';
import MetricCard from '../components/MetricCard';
import LineChart from '../components/LineChart';
import SegmentedControl from '../components/SegmentedControl';
import { colors, radius, spacing, fonts } from '../theme';
import { enter } from '../theme/motion';
import { useAuth } from '../context/AuthContext';
import { metrics, statistic, topSelling } from '../data/dashboardData';

const GAP = 12;

// `initial: false` keeps each stack's list screen underneath so Back behaves naturally.
const SHORTCUTS = [
  { key: 'sale', label: 'New bill', icon: 'receipt-outline', tab: 'Sale', screen: 'NewSale' },
  { key: 'stock', label: 'Add stock', icon: 'cube-outline', tab: 'Stock', screen: 'AddStock' },
  { key: 'po', label: 'New PO', icon: 'cart-outline', tab: 'Purchase', screen: 'AddPurchase' },
  { key: 'sales', label: 'Sales', icon: 'pricetag-outline', tab: 'Sale' },
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [width, setWidth] = useState(0);
  const [period, setPeriod] = useState('Year');

  // Two cards in view with the next one peeking, snapping card by card.
  const cardW = width ? (width - spacing.lg * 2 - GAP) / 2 + 8 : 0;
  const interval = cardW + GAP;
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  return (
    <Screen>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View entering={enter(0)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} accessibilityRole="header">
              Store Dashboard
            </Text>
            <Text style={styles.subtitle}>
              {greeting()} <Text style={styles.name}>{user?.name || 'Admin'}!</Text>
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

        {cardW ? (
          <Animated.ScrollView
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
                  onPress={() => navigation.navigate('MetricDetail', { key: m.key })}
                />
              </Animated.View>
            ))}
          </Animated.ScrollView>
        ) : (
          <View style={styles.carouselPlaceholder} />
        )}

        <Animated.View entering={enter(3)} style={styles.panel}>
          <View style={styles.row}>
            <Text style={[styles.sectionTitle, styles.onCard]}>Statistic</Text>
            <SegmentedControl
              compact
              tone="dark"
              style={styles.toggle}
              options={[
                { key: 'Month', label: 'Month' },
                { key: 'Year', label: 'Year' },
              ]}
              value={period}
              onChange={setPeriod}
            />
          </View>
          <View style={styles.chart}>
            <LineChart series={statistic[period]} />
          </View>
        </Animated.View>

        <Animated.Text entering={enter(5)} style={[styles.sectionTitle, styles.section]}>
          Quick actions
        </Animated.Text>
        <View style={styles.shortcuts}>
          {SHORTCUTS.map((s, i) => (
            <PressableScale
              key={s.key}
              entering={enter(i + 5)}
              style={styles.shortcut}
              accessibilityLabel={s.label}
              onPress={() =>
                navigation.navigate(s.tab, s.screen ? { screen: s.screen, initial: false } : undefined)
              }
            >
              <View style={styles.shortcutRing}>
                <Icon name={s.icon} size={22} color={colors.accentStrong} />
              </View>
              <Text style={styles.shortcutLabel} numberOfLines={1}>
                {s.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        <Animated.Text entering={enter(7)} style={[styles.sectionTitle, styles.section]}>
          Top selling
        </Animated.Text>
        {topSelling.map((d, i) => (
          <Animated.View key={d.id} entering={enter(i + 7)} style={styles.product}>
            <View style={styles.productIcon}>
              <Icon name={d.icon} size={20} color={colors.greenStrong} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.productName}>{d.name}</Text>
              <Text style={styles.productMeta}>{d.orders.toLocaleString('en-IN')} sold</Text>
            </View>
            <Text style={styles.productProfit}>{d.profit}</Text>
          </Animated.View>
        ))}
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: { color: colors.text, fontSize: 26, fontFamily: fonts.display, letterSpacing: -0.6 },
  subtitle: { color: colors.text, fontSize: 14, marginTop: 4 },
  name: { color: colors.accentStrong, fontWeight: '700' },

  carousel: { marginTop: spacing.xl },
  carouselContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: GAP },
  carouselPlaceholder: { height: 236, marginTop: spacing.xl },

  section: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 21, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  onCard: { color: colors.ink },
  toggle: { width: 128 },
  panel: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  chart: { marginTop: spacing.md },

  shortcuts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  shortcut: { alignItems: 'center', width: 72 },
  shortcutRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: { color: colors.text, fontSize: 12, fontWeight: '500', marginTop: spacing.sm },

  product: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.elevated,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.greenStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  productMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  productProfit: { color: colors.greenStrong, fontSize: 14, fontWeight: '700' },
});
