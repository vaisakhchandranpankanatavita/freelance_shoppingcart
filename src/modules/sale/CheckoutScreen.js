import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import SegmentedControl from '../../components/SegmentedControl';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import Heading from '../../components/Heading';
import { colors, spacing, radius } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { addSale } from './services';

const STORE_NAME = 'Grocery Store';
const STORE_UPI_ID = 'grocerystore@upi';

const MODES = [
  { key: 'Cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'UPI', label: 'UPI', icon: 'qr-code-outline' },
  { key: 'Card', label: 'Card', icon: 'card-outline' },
];

const CARDS = [
  { id: 'wallet', brand: 'Wallet', label: 'Store Wallet • ₹200.00', icon: 'wallet-outline' },
  { id: 'card-mc', brand: 'Mastercard', label: '**** **** **** 4975', icon: 'card' },
  { id: 'card-visa', brand: 'Visa', label: '**** **** **** 4975', icon: 'card' },
];

const BANKS = [
  { id: 'bank-sbi', name: 'SBI' },
  { id: 'bank-hdfc', name: 'HDFC' },
];

const money = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  return (
    <Screen>
      <ScreenHeader title="Checkout" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionCard tone="light" fade index={0} style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total amount to be paid</Text>
          <Heading level="display" tone="light" style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
            ₹{money(grand)}
          </Heading>
        </SectionCard>

        <Animated.View entering={enter(1)}>
          <SegmentedControl options={MODES} value={mode} onChange={setMode} style={styles.modes} />
        </Animated.View>

        {/* Keyed by mode: the outgoing panel fades out, the new one rises in. */}
        <Animated.View key={mode} entering={enter(0)} exiting={fadeOut} layout={layout}>
          {mode === 'Cash' ? (
            <SectionCard icon="cash-outline" title="Cash payment">
              <Text style={styles.hint}>Collect ₹{grand.toLocaleString()} from the customer.</Text>
              <InputField
                label="Amount received (₹)"
                value={tendered}
                onChangeText={(v) => setTendered(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Change to return</Text>
                <Text style={styles.changeValue}>₹{money(cashChange)}</Text>
              </View>
            </SectionCard>
          ) : null}

          {mode === 'UPI' ? (
            <SectionCard icon="qr-code-outline" title="Scan to pay via UPI">
              <View style={styles.qrBox}>
                <Icon name="qr-code" size={150} color={colors.paperInk} />
                <Text style={styles.qrStore}>{STORE_NAME}</Text>
                <Text style={styles.qrUpi}>{STORE_UPI_ID}</Text>
                <View style={styles.qrAmountPill}>
                  <Text style={styles.qrAmountText}>₹{Number(grand).toFixed(2)}</Text>
                </View>
              </View>
              <Text style={styles.hint}>
                Ask the customer to scan this QR with any UPI app to pay ₹{Number(grand).toFixed(2)}.
              </Text>
              <Text style={styles.subLabel}>Or choose bank (Net Banking)</Text>
              {BANKS.map((b) => (
                <OptionRow
                  key={b.id}
                  icon="business-outline"
                  title={b.name}
                  active={selectedBank === b.id}
                  onPress={() => setSelectedBank(b.id)}
                />
              ))}
            </SectionCard>
          ) : null}

          {mode === 'Card' ? (
            <SectionCard icon="card-outline" title="Choose a card">
              {CARDS.map((c) => (
                <OptionRow
                  key={c.id}
                  icon={c.icon}
                  title={c.brand}
                  subtitle={c.label}
                  active={selectedCard === c.id}
                  onPress={() => setSelectedCard(c.id)}
                />
              ))}
            </SectionCard>
          ) : null}
        </Animated.View>
      </ScrollView>

      <Animated.View entering={enter(3)} style={styles.footer}>
        <PrimaryButton
          title={submitting ? 'Processing…' : `Pay ₹${Number(grand).toLocaleString()}`}
          variant="light"
          icon="lock-closed"
          onPress={onPay}
          loading={submitting}
        />
      </Animated.View>
    </Screen>
  );
}

function OptionRow({ icon, title, subtitle, active, onPress }) {
  return (
    <Pressable
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={title}
    >
      <View style={styles.optionIcon}>
        <Icon name={icon} size={16} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active ? <Animated.View entering={enter(0)} style={styles.radioInner} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  totalCard: { padding: 24 },
  totalLabel: { color: colors.inkMuted, fontSize: 14 },
  totalValue: { marginTop: spacing.sm },
  modes: { marginBottom: spacing.md },
  hint: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  subLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: spacing.sm, marginBottom: spacing.sm },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.elevated2,
    borderRadius: radius.lg,
  },
  changeLabel: { color: colors.textMuted, fontSize: 13 },
  changeValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  qrBox: {
    alignSelf: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
  },
  qrStore: { fontSize: 15, fontWeight: '800', color: colors.paperInk, marginTop: spacing.sm },
  qrUpi: { fontSize: 12, color: colors.textFaint, marginTop: 2 },
  qrAmountPill: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    backgroundColor: colors.chip,
    borderRadius: radius.pill,
  },
  qrAmountText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: spacing.xs,
  },
  optionActive: { borderColor: colors.text, backgroundColor: colors.elevated2 },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevated3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { fontSize: 15, color: colors.text, fontWeight: '600' },
  optionSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: colors.text },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text },
  footer: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.md },
});
