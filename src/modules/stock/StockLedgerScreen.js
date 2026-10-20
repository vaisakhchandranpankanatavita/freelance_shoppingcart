import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SelectField from '../../components/SelectField';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, shadows, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { getBranches } from '../../api';
import { toOptions } from '../manage/entities';
import { getLedger } from './services';

export default function StockLedgerScreen({ navigation }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  useEffect(() => {
    getBranches().then((res) => setBranches(toOptions(res))).catch(() => setBranches([]));
  }, []);

  const load = async () => {
    try {
      setRows(await getLedger({ branchId: branchId || undefined }));
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [branchId]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const header = (
    <Animated.View entering={enter(1)} style={styles.filterRow}>
      <SelectField
        label="Branch"
        icon="business-outline"
        placeholder="All branches"
        value={branchId}
        options={branches}
        onChange={setBranchId}
      />
    </Animated.View>
  );

  return (
    <Screen header={<ScreenHeader title="Stock ledger" onBack={() => navigation.goBack()} />}>
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
          <Animated.View entering={enter(index + 2)} exiting={fadeOut} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: item.type === 'in' ? `${colors.success}1F` : `${colors.danger}1F` }]}>
              <Icon
                name={item.type === 'in' ? 'arrow-down-outline' : 'arrow-up-outline'}
                size={16}
                color={item.type === 'in' ? colors.successStrong : colors.dangerStrong}
              />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name} numberOfLines={1}>{item.productName || 'Item'}</Text>
              <Text style={styles.sub} numberOfLines={1}>{[item.branchName, item.date, item.reference].filter(Boolean).join(' • ')}</Text>
            </View>
            <Text style={[styles.qty, { color: item.type === 'in' ? colors.successStrong : colors.dangerStrong }]}>
              {item.type === 'in' ? '+' : '-'}{item.qty}
            </Text>
          </Animated.View>
        )}
        ListEmptyComponent={
          !loaded ? null : error ? (
            <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load ledger" message={error} actionLabel="Try again" onAction={onRefresh} />
          ) : (
            <EmptyState icon="book-outline" title="No movements" message="Stock movements will show up here." />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: spacing.xl },
  filterRow: { marginBottom: spacing.md },
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
  iconWrap: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  qty: { fontSize: 15, fontFamily: fonts.bodyBold },
});
