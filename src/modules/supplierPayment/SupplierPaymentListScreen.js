import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useTabBarScrollHandler } from '../../components/tabBarScroll';
import Icon from '../../components/Icon';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT_LARGE } from '../../components/ScreenHeader';
import AddButton from '../../components/AddButton';
import PressableScale from '../../components/PressableScale';
import SummaryTiles from '../../components/SummaryTiles';
import SelectField from '../../components/SelectField';
import EmptyState from '../../components/EmptyState';
import { colors, spacing, radius, shadows } from '../../theme';
import { rupees, shortDate } from '../../utils/format';
import { enter, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';
import { getSuppliers } from '../../api';
import { toOptions } from '../manage/entities';
import { BACKEND_READY, getPaymentHistory, getPayments } from './services';

const modeIcon = { Cash: 'cash-outline', UPI: 'phone-portrait-outline', Bank: 'business-outline', Cheque: 'document-text-outline' };

export default function SupplierPaymentListScreen({ navigation }) {
  const { can } = useAuth();
  const canCreate = BACKEND_READY && can('create', 'supplierPayment');
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useTabBarScrollHandler(scrollY);

  useEffect(() => {
    if (!BACKEND_READY) return;
    getSuppliers().then((res) => setSuppliers(toOptions(res))).catch(() => setSuppliers([]));
  }, []);

  const load = async () => {
    if (!BACKEND_READY) {
      setLoaded(true);
      return;
    }
    try {
      setData(supplierId ? await getPaymentHistory(supplierId) : await getPayments());
      setError('');
    } catch (e) {
      setError(e.message || 'Check your connection and try again.');
    } finally {
      setLoaded(true);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, [supplierId]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const total = data.reduce((s, d) => s + d.amount, 0);

  const header = !BACKEND_READY ? null : (
    <>
      <SummaryTiles
        tiles={[
          { value: data.length, label: 'Payments', tone: 'light' },
          { value: rupees(total), label: 'Total paid' },
        ]}
      />
      <Animated.View entering={enter(2)} style={styles.filter}>
        <SelectField label="Supplier" icon="people-outline" placeholder="All suppliers" value={supplierId} options={suppliers} onChange={setSupplierId} />
      </Animated.View>
    </>
  );

  return (
    <Screen header={<ScreenHeader large title="Supplier payments" onBack={() => navigation.goBack()} />}>
      <Animated.FlatList
        data={data}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        itemLayoutAnimation={layout}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
        renderItem={({ item, index }) => (
          <Animated.View entering={enter(index + 3)} exiting={fadeOut}>
            <PressableScale
              scaleTo={0.98}
              style={styles.card}
              onPress={() => navigation.navigate('SupplierPaymentForm', { paymentId: item.id })}
              accessibilityLabel={`Payment to ${item.supplier}`}
            >
              <View style={styles.iconWrap}>
                <Icon name={modeIcon[item.mode] || 'cash-outline'} size={16} color={colors.ink} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.name} numberOfLines={1}>{item.supplier || 'Supplier'}</Text>
                <Text style={styles.sub} numberOfLines={1}>{shortDate(item.date)} • {item.mode}{item.reference ? ` • ${item.reference}` : ''}</Text>
              </View>
              <Text style={styles.amount}>{rupees(item.amount)}</Text>
            </PressableScale>
          </Animated.View>
        )}
        ListEmptyComponent={
          !loaded ? null : !BACKEND_READY ? (
            <EmptyState
              tone="locked"
              icon="lock-closed-outline"
              title="Supplier payments"
              message="This feature unlocks as soon as the backend ships support for it. The screen is ready and will go live automatically."
            />
          ) : error ? (
            <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load payments" message={error} actionLabel="Try again" onAction={onRefresh} />
          ) : (
            <EmptyState icon="wallet-outline" title="No payments yet" message="Record a payment when you pay a supplier." actionLabel={canCreate ? 'New payment' : undefined} onAction={canCreate ? () => navigation.navigate('SupplierPaymentForm') : undefined} />
          )
        }
      />
      {canCreate ? (
        <AddButton accessibilityLabel="New supplier payment" scrollY={scrollY} inHeader onPress={() => navigation.navigate('SupplierPaymentForm')} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT_LARGE, paddingBottom: 112 },
  filter: { marginBottom: spacing.md },
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
  iconWrap: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: colors.text },
});
