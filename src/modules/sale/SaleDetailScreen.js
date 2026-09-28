import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import Heading from '../../components/Heading';
import { colors, spacing, radius } from '../../theme';

const DELIVERY_LABELS = {
  pickup: 'Store Pickup',
  home: 'Home Delivery',
  express: 'Express',
};

const DELIVERY_ICONS = {
  pickup: 'storefront-outline',
  home: 'bicycle-outline',
  express: 'flash-outline',
};

const PAYMENT_LABELS = {
  wallet: 'Wallet',
  cod: 'Pay On Delivery',
  'card-mc': 'Mastercard •••• 4975',
  'card-visa': 'Visa •••• 4975',
  'bank-sbi': 'SBI Net Banking',
  'bank-hdfc': 'HDFC Net Banking',
};

const MODE_ICONS = {
  Cash: 'cash-outline',
  UPI: 'phone-portrait-outline',
  Card: 'card-outline',
};

const money = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params || {};
  if (!sale) {
    return (
      <Screen>
        <ScreenHeader title="Sale details" onBack={() => navigation.goBack()} />
        <Text style={styles.empty}>Sale not found.</Text>
      </Screen>
    );
  }

  const {
    id,
    date,
    customer,
    phone,
    delivery,
    mode,
    paymentMethod,
    items = 0,
    total = 0,
    cart = [],
  } = sale;

  const subtotal = Number(total) || 0;
  const tax = +(subtotal * 0.05).toFixed(2);
  const grand = +(subtotal + tax).toFixed(2);

  return (
    <Screen>
      <ScreenHeader title="Sale details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionCard tone="light" fade index={0} style={styles.hero}>
          <Text style={styles.heroLabel}>Total amount</Text>
          <Heading level="display" tone="light" style={styles.heroTotal} numberOfLines={1} adjustsFontSizeToFit>
            ₹{money(grand)}
          </Heading>
          <View style={styles.heroChips}>
            <Chip icon="receipt-outline" text={id} />
            <Chip icon="calendar-outline" text={date} />
          </View>
        </SectionCard>

        <SectionCard icon="person-circle-outline" title="Customer" index={1}>
          <Row label="Name" value={customer || 'Walk-in'} />
          {phone ? <Row label="Phone" value={phone} /> : null}
        </SectionCard>

        <SectionCard icon={DELIVERY_ICONS[delivery] || 'cube-outline'} title="Delivery" index={2}>
          <Row label="Type" value={DELIVERY_LABELS[delivery] || 'Store Pickup'} />
        </SectionCard>

        <SectionCard icon="cart-outline" title={`Items (${items || cart.reduce((s, i) => s + i.qty, 0)})`} index={3}>
          {cart.length === 0 ? (
            <Text style={styles.mutedText}>Item breakdown not available for this sale.</Text>
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
                <Text style={styles.itemTotal}>₹{(i.qty * i.price).toLocaleString()}</Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard icon="wallet-outline" title="Payment" index={4}>
          <Row label="Mode" value={mode || 'Cash'} valueIcon={MODE_ICONS[mode] || 'cash-outline'} />
          {paymentMethod ? <Row label="Method" value={PAYMENT_LABELS[paymentMethod] || paymentMethod} /> : null}
          <View style={styles.divider} />
          <Row label="Subtotal" value={`₹${subtotal.toLocaleString()}`} />
          <Row label="Tax (5%)" value={`₹${tax.toLocaleString()}`} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Grand total</Text>
            <Text style={styles.grandValue}>₹{money(grand)}</Text>
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function Chip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Icon name={icon} size={12} color={colors.text} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Row({ label, value, valueIcon }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        {valueIcon ? <Icon name={valueIcon} size={14} color={colors.textMuted} style={{ marginRight: 6 }} /> : null}
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  hero: { padding: 24 },
  heroLabel: { color: colors.inkMuted, fontSize: 14 },
  heroTotal: { marginTop: spacing.sm, marginBottom: spacing.lg },
  heroChips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center' },
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
  divider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.sm },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  grandLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
  grandValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
