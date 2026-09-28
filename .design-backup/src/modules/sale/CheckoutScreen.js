import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';
import { addSale } from './services';

const STORE_NAME = 'Grocery Store';
const STORE_UPI_ID = 'grocerystore@upi';

const CARDS = [
  { id: 'wallet', brand: 'Wallet', label: 'Store Wallet • ₹200.00', icon: 'wallet-outline', tint: colors.primaryDark },
  { id: 'card-mc', brand: 'Mastercard', label: '**** **** **** 4975', icon: 'card', tint: '#EB5A2A' },
  { id: 'card-visa', brand: 'Visa', label: '**** **** **** 4975', icon: 'card', tint: '#1A1F71' },
];

const BANKS = [
  { id: 'bank-sbi', name: 'SBI', tint: '#2563EB' },
  { id: 'bank-hdfc', name: 'HDFC', tint: '#DC2626' },
];

export default function CheckoutScreen({ route, navigation }) {
  const {
    customer = 'Walk-in',
    phone = '',
    delivery = 'pickup',
    items = 0,
    subtotal = 0,
    fee = 0,
    grand = 0,
    cart = [],
    mode: initialMode = 'Cash',
  } = route.params || {};

  const [mode, setMode] = useState(initialMode);
  const [selectedCard, setSelectedCard] = useState('wallet');
  const [selectedBank, setSelectedBank] = useState('bank-sbi');
  const [tendered, setTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cashChange = Math.max(0, (Number(tendered) || 0) - grand);

  const onPay = async () => {
    let paymentMethod = mode;
    if (mode === 'Card') paymentMethod = selectedCard;
    if (mode === 'UPI') paymentMethod = selectedBank;

    if (mode === 'Cash' && Number(tendered) > 0 && Number(tendered) < grand) {
      Alert.alert('Insufficient cash', 'Amount received is less than the total.');
      return;
    }

    try {
      setSubmitting(true);
      const saved = await addSale({
        customer, phone, delivery, mode, items,
        total: subtotal, fee, grandTotal: grand,
        paymentMethod,
      });
      navigation.replace('BillPreview', {
        invoiceId: saved?.id,
        date: saved?.date,
        customer, phone, delivery, mode, paymentMethod,
        cart, items,
        total: subtotal, fee, grand,
      });
    } catch (e) {
      Alert.alert('Payment failed', e.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Radio = ({ active }) => (
    <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
      {active ? <View style={styles.radioInner} /> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total amount to be paid:</Text>
        <Text style={styles.totalValue}>
          ₹{Number(grand).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}>
        {/* Payment Mode */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="swap-horizontal-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.cardTitle}>Choose Payment Mode</Text>
          </View>
          <View style={styles.modeRow}>
            {[
              { key: 'Cash', icon: 'cash-outline' },
              { key: 'UPI', icon: 'qr-code-outline' },
              { key: 'Card', icon: 'card-outline' },
            ].map((m) => {
              const active = mode === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => setMode(m.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={m.icon}
                    size={16}
                    color={active ? '#fff' : colors.primaryDark}
                  />
                  <Text style={[styles.modeText, active && { color: '#fff' }]}>{m.key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cash */}
        {mode === 'Cash' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.cardTitle}>Cash Payment</Text>
            </View>
            <Text style={styles.cashHint}>Collect ₹{grand.toLocaleString()} from the customer.</Text>

            <Text style={styles.detailsLabel}>Amount Received</Text>
            <View style={styles.feeRow}>
              <Text style={styles.feePrefix}>₹</Text>
              <TextInput
                style={styles.feeInput}
                value={tendered}
                onChangeText={(v) => setTendered(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.changeRow}>
              <Text style={styles.changeLabel}>Change to return</Text>
              <Text style={styles.changeValue}>₹{cashChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>
        ) : null}

        {/* UPI */}
        {mode === 'UPI' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="qr-code-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.cardTitle}>Scan to Pay via UPI</Text>
            </View>

            <View style={styles.qrBox}>
              <Ionicons name="qr-code" size={140} color={colors.primaryDark} />
              <Text style={styles.qrStore}>{STORE_NAME}</Text>
              <Text style={styles.qrUpi}>{STORE_UPI_ID}</Text>
              <View style={styles.qrAmountPill}>
                <Text style={styles.qrAmountText}>₹{Number(grand).toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.qrHint}>
              Ask the customer to scan this QR with any UPI app to pay ₹{Number(grand).toFixed(2)}.
            </Text>

            <Text style={styles.detailsLabel}>Or choose bank (Net Banking)</Text>
            {BANKS.map((b) => {
              const active = selectedBank === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={styles.row}
                  onPress={() => setSelectedBank(b.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIconWrap, { backgroundColor: b.tint + '22' }]}>
                    <Ionicons name="business-outline" size={16} color={b.tint} />
                  </View>
                  <Text style={styles.rowTitle}>{b.name}</Text>
                  <Radio active={active} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Card */}
        {mode === 'Card' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="card-outline" size={18} color={colors.primaryDark} />
              <Text style={styles.cardTitle}>Choose a Card</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity>
                <Text style={styles.linkText}>Add Card</Text>
              </TouchableOpacity>
            </View>
            {CARDS.map((c) => {
              const active = selectedCard === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.row}
                  onPress={() => setSelectedCard(c.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rowIconWrap, { backgroundColor: c.tint + '22' }]}>
                    <Ionicons name={c.icon} size={16} color={c.tint} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.rowTitle}>{c.brand}</Text>
                    <Text style={styles.rowSubtitle}>{c.label}</Text>
                  </View>
                  <Radio active={active} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, submitting && { opacity: 0.7 }]}
          onPress={onPay}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.payText}>
            {submitting ? 'Processing…' : `Pay ₹${Number(grand).toLocaleString()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.primaryDark },

  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalLabel: { color: colors.text, fontSize: 13 },
  totalValue: { color: colors.success, fontSize: 16, fontWeight: '800' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  linkText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },

  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  modeText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },

  cashHint: { color: colors.text, fontSize: 13, marginBottom: spacing.md },
  detailsLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginTop: spacing.sm, marginBottom: spacing.xs,
  },
  feeRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    height: 44, backgroundColor: colors.background,
  },
  feePrefix: { fontSize: 15, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  feeInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0, outlineWidth: 0, outlineStyle: 'none' },

  changeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  changeLabel: { color: colors.textMuted, fontSize: 12 },
  changeValue: { color: colors.primaryDark, fontSize: 16, fontWeight: '800' },

  qrBox: {
    alignSelf: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primaryDark,
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  qrStore: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  qrUpi: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  qrAmountPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    backgroundColor: colors.primaryDark,
    borderRadius: radius.pill,
  },
  qrAmountText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  qrHint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: spacing.sm },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTitle: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  rowSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  radioOuter: {
    width: 20, height: 20, borderRadius: 999,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.primaryDark },
  radioInner: { width: 10, height: 10, borderRadius: 999, backgroundColor: colors.primaryDark },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  payBtn: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#F4C430',
    alignItems: 'center', justifyContent: 'center',
  },
  payText: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 },
});
