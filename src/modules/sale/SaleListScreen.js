import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import IconButton from '../../components/IconButton';
import PressableScale from '../../components/PressableScale';
import StatCard from '../../components/StatCard';
import { colors, spacing, radius } from '../../theme';
import { enter, layout } from '../../theme/motion';
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

  const header = (
    <View style={styles.summaryRow}>
      <StatCard icon="receipt-outline" label="Today's bills" value={String(todayCount)} index={1} />
      <StatCard icon="cash-outline" label="Today's sales" value={`₹${todayTotal.toLocaleString()}`} index={2} />
    </View>
  );

  return (
    <Screen>
      <ScreenHeader
        large
        title="Sales"
        left={
          <IconButton icon="person" variant="light" accessibilityLabel="Profile and settings"
            onPress={() => navigation.getParent()?.navigate('More') ?? navigation.navigate('More')} />
        }
        right={
          <IconButton icon="add" variant="light" accessibilityLabel="New bill"
            onPress={() => navigation.navigate('NewSale')} />
        }
      />

      <Animated.FlatList
        data={data}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={layout}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter(index + 3)}>
            <PressableScale
              scaleTo={0.97}
              style={styles.card}
              onPress={() => navigation.navigate('SaleDetail', { sale: item })}
              accessibilityLabel={`Sale ${item.id} for ${item.customer}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.customer.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.customer} numberOfLines={1}>{item.customer}</Text>
                <Text style={styles.sub}>{item.id} • {item.date}</Text>
                <View style={styles.modeRow}>
                  <Icon name={modeIcon[item.mode] || 'card-outline'} size={12} color={colors.textMuted} />
                  <Text style={styles.sub}>{item.mode} • {item.items} items</Text>
                </View>
              </View>
              <Text style={styles.total}>₹{item.total.toLocaleString()}</Text>
              <Icon name="chevron-forward" size={18} color={colors.textFaint} style={{ marginLeft: spacing.xs }} />
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sales yet.</Text>}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.ink },
  customer: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  total: { fontSize: 16, fontWeight: '800', color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
