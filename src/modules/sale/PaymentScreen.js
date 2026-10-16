import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import Heading from '../../components/Heading';
import BottomBar from '../../components/BottomBar';
import { colors, spacing, radius } from '../../theme';
import { enter } from '../../theme/motion';
import { rupees, rupeesExact } from '../../utils/format';

const DELIVERY_LABELS = {
  pickup: 'Store pickup',
  home: 'Home delivery',
  express: 'Express',
};

const DELIVERY_ICONS = {
  pickup: 'storefront-outline',
  home: 'bicycle-outline',
  express: 'flash-outline',
};

const DEFAULT_FEE = { pickup: 0, home: 40, express: 80 };

export default function PaymentScreen({ route, navigation }) {
  const {
    total = 0,
    items = 0,
    customer = 'Walk-in',
    phone = '',
    delivery = 'pickup',
    mode = 'Cash',
    cart = [],
  } = route.params || {};

  const [feeStr, setFeeStr] = useState(String(DEFAULT_FEE[delivery] ?? 0));
  const fee = delivery === 'pickup' ? 0 : Number(feeStr) || 0;
  const subtotal = Number(total) || 0;
  const grand = useMemo(() => +(subtotal + fee).toFixed(2), [subtotal, fee]);

  const onCheckout = () => {
    navigation.navigate('Checkout', {
      customer,
      phone,
      delivery,
      mode,
      items,
      subtotal,
      fee,
      grand,
      cart,
    });
  };

  return (
    <Screen header={<ScreenHeader title="Bill summary" onBack={() => navigation.goBack()} />}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionCard icon="person-outline" title="Customer" index={0}>
          <Row label="Name" value={customer || 'Walk-in'} />
          {phone ? <Row label="Phone" value={phone} /> : null}
        </SectionCard>

        <SectionCard icon="cart-outline" title={`Items (${items})`} index={1}>
          {cart.length === 0 ? (
            <Text style={styles.mutedText}>No items.</Text>
          ) : (
            cart.map((i, idx) => (
              <View key={i.id || idx} style={[styles.itemRow, idx === cart.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.itemThumb}>
                  <Icon name="cube-outline" size={16} color={colors.text} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.itemName} numberOfLines={1}>{i.name}</Text>
                  <Text style={styles.itemMeta}>Qty {i.qty} × ₹{i.price}</Text>
                </View>
                <Text style={styles.itemTotal}>{rupees(i.qty * i.price)}</Text>
              </View>
            ))
          )}
        </SectionCard>

        {/* Pickup has no fee to set — only show the field when the order is going out. */}
        {delivery === 'pickup' ? null : (
        <SectionCard icon={DELIVERY_ICONS[delivery]} title={DELIVERY_LABELS[delivery]} index={2}>
          <InputField
            label="Delivery fee (₹)"
            icon="cash-outline"
            value={feeStr}
            onChangeText={(v) => setFeeStr(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
            style={{ marginBottom: 0 }}
          />
        </SectionCard>
        )}

        <SectionCard tone="light" fade index={3}>
          <Row light label="Subtotal" value={rupeesExact(subtotal)} />
          {delivery === 'pickup' ? null : <Row light label="Delivery fee" value={rupeesExact(fee)} />}
          <View style={styles.divider} />
          <Text style={styles.grandLabel}>Grand total</Text>
          <Heading level="title" tone="light" style={styles.grandValue}>
            {rupeesExact(grand)}
          </Heading>
        </SectionCard>
      </ScrollView>

      {/* bottom clears the floating TabBar (position:'absolute', bottom:0), same convention as
          DashboardScreen's BottomBar - this screen sits inside SaleNavigator's tab stack. */}
      <BottomBar>
        <PrimaryButton style={{ flex: 1 }} title={`Take payment · ${rupees(grand)}`} icon="card-outline" variant="light" onPress={onCheckout} />
      </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Row({ label, value, light }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={[styles.rowLabel, light && { color: colors.inkMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, light && { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: 150 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  itemThumb: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.elevated3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  mutedText: { color: colors.textMuted, fontSize: 13 },
  divider: { height: 1, backgroundColor: colors.inkLine, marginVertical: spacing.md },
  grandLabel: { color: colors.inkMuted, fontSize: 14 },
  grandValue: { marginTop: 2 },
});
