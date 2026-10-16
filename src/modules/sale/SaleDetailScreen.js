import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SharedBadge from '../../components/SharedBadge';
import IconButton from '../../components/IconButton';
import SectionCard from '../../components/SectionCard';
import Heading from '../../components/Heading';
import BottomBar from '../../components/BottomBar';
import PrimaryButton from '../../components/PrimaryButton';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing, radius, fonts } from '../../theme';
import { rupees, rupeesExact, shortDate } from '../../utils/format';
import { getSale, refundSale } from './services';

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

const MODE_ICONS = {
  Cash: 'cash-outline',
  UPI: 'phone-portrait-outline',
  Card: 'card-outline',
};

export default function SaleDetailScreen({ route, navigation }) {
  const { sale: initialSale } = route.params || {};
  const [sale, setSale] = useState(initialSale);
  const { toast, confirm } = useFeedback();
  const [refunding, setRefunding] = useState(false);

  // Row 72: refresh from the bill's own detail each time this screen comes into focus (e.g.
  // after saving an edit), falling back to whatever the list screen already passed in.
  useFocusEffect(
    useCallback(() => {
      if (!initialSale?.id) return;
      getSale(initialSale.id).then(setSale).catch(() => {});
    }, [initialSale?.id])
  );

  if (!sale) {
    return (
      <Screen header={<ScreenHeader title="Sale details" onBack={() => navigation.goBack()} />}>
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
    items = 0,
    fee = 0,
    total = 0,
    cart = [],
  } = sale;

  // `total` is what the customer was charged (grand_total) — the bill, the refund and the
  // reprint all use it as-is. The item subtotal is rebuilt from the lines for the breakdown.
  const grand = Number(total) || 0;
  const deliveryFee = Number(fee) || 0;
  const subtotal = cart.length ? cart.reduce((s, i) => s + i.qty * i.price, 0) : grand - deliveryFee;
  const itemCount = items || cart.reduce((s, i) => s + i.qty, 0);
  // Anything the backend added or took off beyond items + delivery (tax, rounding, discount) is
  // shown as its own line so the breakdown always adds up to what was paid.
  const adjustment = Math.round((grand - subtotal - deliveryFee) * 100) / 100;

  const reprintReceipt = () => {
    navigation.navigate('BillPreview', {
      invoiceId: id,
      date,
      customer,
      phone,
      delivery,
      mode,
      cart,
      items: itemCount,
      total: subtotal,
      fee: deliveryFee,
      grand,
      fromReprint: true,
    });
  };

  const onRefund = async () => {
    const ok = await confirm({
      title: 'Refund this bill?',
      message: `${rupeesExact(grand)} goes back to ${customer || 'the customer'}. This can't be undone.`,
      confirmLabel: 'Refund',
      destructive: true,
    });
    if (!ok) return;
    setRefunding(true);
    try {
      await refundSale(id, { amount: grand });
      toast({ tone: 'success', title: 'Bill refunded' });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't refund", message: e.message || 'Try again.' });
    } finally {
      setRefunding(false);
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Sale details"
          onBack={() => navigation.goBack()}
          right={
            <View style={styles.headerActions}>
              <IconButton
                icon="create-outline"
                size={40}
                onPress={() => navigation.navigate('NewSale', { saleId: id })}
                accessibilityLabel="Edit bill"
              />
              <SharedBadge tag={`sale-${id}`} letter={String(customer).charAt(0).toUpperCase()} size={44} radius={22} />
            </View>
          }
        />
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionCard tone="light" fade index={0} style={styles.hero}>
          <Text style={styles.heroLabel}>Total paid</Text>
          <Heading level="display" tone="light" style={styles.heroTotal} numberOfLines={1} adjustsFontSizeToFit>
            {rupeesExact(grand)}
          </Heading>
          <View style={styles.heroChips}>
            <Chip icon="receipt-outline" text={`Bill ${id}`} />
            <Chip icon="calendar-outline" text={shortDate(date)} />
          </View>
        </SectionCard>

        <SectionCard icon="person-circle-outline" title="Customer" index={1}>
          <Row label="Name" value={customer || 'Walk-in'} />
          {phone ? <Row label="Phone" value={phone} /> : null}
        </SectionCard>

        <SectionCard icon={DELIVERY_ICONS[delivery] || 'cube-outline'} title="Delivery" index={2}>
          <Row label="Type" value={DELIVERY_LABELS[delivery] || 'Store Pickup'} />
        </SectionCard>

        <SectionCard icon="cart-outline" title={`Items (${itemCount})`} index={3}>
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
                  <Text style={styles.itemMeta} numberOfLines={1}>Qty {i.qty} × ₹{i.price}</Text>
                </View>
                <Text style={styles.itemTotal}>{rupees(i.qty * i.price)}</Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard icon="wallet-outline" title="Payment" index={4}>
          <Row label="Mode" value={mode || 'Cash'} valueIcon={MODE_ICONS[mode] || 'cash-outline'} />
          <View style={styles.divider} />
          <Row label="Subtotal" value={rupeesExact(subtotal)} />
          {deliveryFee ? <Row label="Delivery fee" value={rupeesExact(deliveryFee)} /> : null}
          {adjustment ? (
            <Row label={adjustment > 0 ? 'Other charges' : 'Discount'} value={`${adjustment < 0 ? '−' : ''}${rupeesExact(Math.abs(adjustment))}`} />
          ) : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total paid</Text>
            <Text style={styles.grandValue}>{rupeesExact(grand)}</Text>
          </View>
        </SectionCard>
      </ScrollView>

      <BottomBar>
        <PrimaryButton style={{ flex: 1 }} title="Refund bill" icon="return-down-back-outline" variant="dark" onPress={onRefund} loading={refunding} />
        <PrimaryButton style={{ flex: 1 }} title="Reprint" icon="print-outline" variant="light" onPress={reprintReceipt} />
      </BottomBar>
    </Screen>
  );
}

function Chip({ icon, text }) {
  return (
    <View style={styles.chip}>
      <Icon name={icon} size={12} color={colors.ink} />
      <Text style={styles.chipText}>{text}</Text>
    </View>
  );
}

function Row({ label, value, valueIcon }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
      <View style={[styles.rowValueWrap, { flexShrink: 1 }]}>
        {valueIcon ? <Icon name={valueIcon} size={14} color={colors.textMuted} style={{ marginRight: 6 }} /> : null}
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: 150 },
  hero: { padding: 24 },
  heroLabel: { color: colors.inkMuted, fontSize: 14 },
  heroTotal: { marginTop: spacing.sm, marginBottom: spacing.lg },
  heroChips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.chip,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
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
  grandLabel: { fontSize: 16, fontFamily: fonts.display, color: colors.text },
  grandValue: { fontSize: 20, fontFamily: fonts.display, color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: HEADER_HEIGHT + spacing.xl },
});
