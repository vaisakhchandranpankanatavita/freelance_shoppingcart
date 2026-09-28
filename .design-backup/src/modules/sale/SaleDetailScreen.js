import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function SaleDetailScreen({ route, navigation }) {
  const { sale } = route.params || {};
  if (!sale) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>Sale not found.</Text>
      </SafeAreaView>
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sale Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Total Amount</Text>
          <Text style={styles.heroTotal}>₹{Number(grand).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <View style={styles.heroChips}>
            <View style={styles.heroChip}>
              <Ionicons name="receipt-outline" size={12} color="#fff" />
              <Text style={styles.heroChipText}>{id}</Text>
            </View>
            <View style={styles.heroChip}>
              <Ionicons name="calendar-outline" size={12} color="#fff" />
              <Text style={styles.heroChipText}>{date}</Text>
            </View>
          </View>
        </View>

        {/* Customer */}
        <SectionCard icon="person-circle-outline" title="Customer">
          <Row label="Name" value={customer || 'Walk-in'} />
          {phone ? <Row label="Phone" value={phone} /> : null}
        </SectionCard>

        {/* Delivery */}
        <SectionCard icon="bicycle-outline" title="Delivery">
          <View style={styles.deliveryPill}>
            <Ionicons
              name={DELIVERY_ICONS[delivery] || 'cube-outline'}
              size={16}
              color={colors.primaryDark}
            />
            <Text style={styles.deliveryPillText}>
              {DELIVERY_LABELS[delivery] || 'Store Pickup'}
            </Text>
          </View>
        </SectionCard>

        {/* Items */}
        <SectionCard icon="cart-outline" title={`Items (${items || cart.reduce((s, i) => s + i.qty, 0)})`}>
          {cart.length === 0 ? (
            <Text style={styles.mutedText}>
              Item breakdown not available for this sale.
            </Text>
          ) : (
            cart.map((i, idx) => (
              <View
                key={i.id || idx}
                style={[styles.itemRow, idx === cart.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.itemThumb}>
                  <Ionicons name="cube-outline" size={16} color={colors.primaryDark} />
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

        {/* Payment */}
        <SectionCard icon="wallet-outline" title="Payment">
          <Row
            label="Mode"
            value={mode || 'Cash'}
            valueIcon={MODE_ICONS[mode] || 'cash-outline'}
          />
          {paymentMethod ? (
            <Row label="Method" value={PAYMENT_LABELS[paymentMethod] || paymentMethod} />
          ) : null}
          <View style={styles.divider} />
          <Row label="Subtotal" value={`₹${subtotal.toLocaleString()}`} />
          <Row label="Tax (5%)" value={`₹${tax.toLocaleString()}`} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>
              ₹{grand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </SectionCard>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons name={icon} size={16} color={colors.primaryDark} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

function Row({ label, value, valueIcon }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>
        {valueIcon ? (
          <Ionicons name={valueIcon} size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
        ) : null}
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceAlt },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 16, fontWeight: '700', color: colors.primaryDark,
  },

  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  heroTotal: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 6, marginBottom: spacing.sm },
  heroChips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radius.pill,
  },
  heroChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardIcon: {
    width: 28, height: 28, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardBody: { paddingTop: spacing.xs },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValueWrap: { flexDirection: 'row', alignItems: 'center' },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600' },

  deliveryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
  },
  deliveryPillText: { color: colors.text, fontWeight: '600', fontSize: 13 },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  itemThumb: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: '700', color: colors.text },

  mutedText: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },

  divider: {
    borderTopWidth: 1, borderTopColor: colors.border,
    borderStyle: 'dashed',
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  grandLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  grandValue: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },

  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
