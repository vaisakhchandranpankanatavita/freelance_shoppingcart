import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import SegmentedControl from '../../components/SegmentedControl';
import InputField from '../../components/InputField';
import PressableScale from '../../components/PressableScale';
import { useFeedback } from '../../components/Feedback';
import PrimaryButton from '../../components/PrimaryButton';
import Heading from '../../components/Heading';
import BottomBar from '../../components/BottomBar';
import { colors, spacing, radius, fonts } from '../../theme';
import { enter, fadeOut, layout } from '../../theme/motion';
import { rupees, rupeesExact } from '../../utils/format';
import { addSale } from './services';

const MODES = [
  { key: 'Cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'UPI', label: 'UPI', icon: 'qr-code-outline' },
  { key: 'Card', label: 'Card', icon: 'card-outline' },
];

// What the cashier is most likely handed for this total: the exact amount, then the next round
// note values above it. Tapping one fills "Amount received" so the change is worked out for them.
const cashSuggestions = (grand) => {
  const steps = [10, 50, 100, 500, 2000];
  const out = new Set([Math.ceil(grand)]);
  steps.forEach((s) => {
    const next = Math.ceil(grand / s) * s;
    if (next > grand) out.add(next);
  });
  return [...out].sort((a, b) => a - b).slice(0, 4);
};

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

  const { toast } = useFeedback();
  const [mode, setMode] = useState(initialMode);
  const [tendered, setTendered] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const received = Number(tendered) || 0;
  const short = mode === 'Cash' && received > 0 && received < grand;
  const cashChange = Math.max(0, received - grand);

  const onPay = async () => {
    if (short) {
      toast({ tone: 'error', title: 'Not enough cash', message: `${rupeesExact(grand - received)} more is needed.` });
      return;
    }

    try {
      setSubmitting(true);
      const saved = await addSale({
        customer, phone, delivery, mode, items, cart,
        total: subtotal, fee, grandTotal: grand,
        paymentMethod: mode,
      });
      navigation.replace('BillPreview', {
        invoiceId: saved?.id || undefined,
        date: saved?.date || undefined,
        customer, phone, delivery, mode,
        cart, items,
        total: subtotal, fee, grand,
      });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't save the bill", message: e.message || 'Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen header={<ScreenHeader title="Take payment" onBack={() => navigation.goBack()} />}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionCard tone="light" fade index={0} style={styles.totalCard}>
          <Text style={styles.totalLabel}>To collect from {customer || 'the customer'}</Text>
          <Heading level="display" tone="light" style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>
            {rupeesExact(grand)}
          </Heading>
          <Text style={styles.totalMeta}>
            {items} item{items === 1 ? '' : 's'}
            {fee ? ` + ${rupees(fee)} delivery` : ''}
          </Text>
        </SectionCard>

        <Animated.View entering={enter(1)}>
          <SegmentedControl options={MODES} value={mode} onChange={setMode} style={styles.modes} />
        </Animated.View>

        {/* Keyed by mode: the outgoing panel fades out, the new one rises in. */}
        <Animated.View key={mode} entering={enter(0)} exiting={fadeOut} layout={layout}>
          {mode === 'Cash' ? (
            <SectionCard icon="cash-outline" title="Cash received">
              <View style={styles.quickRow}>
                {cashSuggestions(grand).map((amt) => {
                  const active = received === amt;
                  return (
                    <PressableScale
                      key={amt}
                      style={[styles.quick, active && styles.quickActive]}
                      onPress={() => setTendered(String(amt))}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Received ${rupees(amt)}`}
                    >
                      <Text style={[styles.quickText, active && styles.quickTextActive]}>{rupees(amt)}</Text>
                    </PressableScale>
                  );
                })}
              </View>
              <InputField
                label="Amount received (₹)"
                value={tendered}
                onChangeText={(v) => setTendered(v.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="Leave empty if exact"
                error={short ? `${rupeesExact(grand - received)} short` : undefined}
              />
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Change to return</Text>
                <Text style={styles.changeValue}>{rupeesExact(cashChange)}</Text>
              </View>
            </SectionCard>
          ) : null}

          {mode === 'UPI' ? (
            <SectionCard icon="qr-code-outline" title="UPI payment">
              <Step n={1} text="Show the customer the store's UPI QR at the counter." />
              <Step n={2} text={`Ask them to pay ${rupeesExact(grand)}.`} />
              <Step n={3} text="Confirm the payment has arrived in your UPI app, then save the bill." last />
            </SectionCard>
          ) : null}

          {mode === 'Card' ? (
            <SectionCard icon="card-outline" title="Card payment">
              <Step n={1} text={`Enter ${rupeesExact(grand)} on the card machine.`} />
              <Step n={2} text="Let the customer tap, insert or swipe their card." />
              <Step n={3} text="Once the machine prints an approved slip, save the bill." last />
            </SectionCard>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* bottom clears the floating TabBar (position:'absolute', bottom:0), same convention as
          DashboardScreen's BottomBar - this screen sits inside SaleNavigator's tab stack. */}
      <BottomBar>
        <PrimaryButton
          style={{ flex: 1 }}
          title={submitting ? 'Saving bill…' : `Paid by ${mode} · Save bill`}
          variant="light"
          icon="checkmark"
          onPress={onPay}
          loading={submitting}
        />
      </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}

// These really are ordered steps the cashier follows, so they're numbered.
function Step({ n, text, last }) {
  return (
    <View style={[styles.step, last && { marginBottom: 0 }]}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: 150 },
  totalCard: { padding: 24 },
  totalLabel: { color: colors.inkMuted, fontSize: 14 },
  totalValue: { marginTop: spacing.sm },
  totalMeta: { color: colors.inkMuted, fontSize: 13, marginTop: spacing.xs },
  modes: { marginBottom: spacing.md },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  quick: {
    minWidth: 72,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  quickText: { color: colors.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  quickTextActive: { color: colors.onAccent },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.elevated2,
    borderRadius: radius.lg,
  },
  changeLabel: { color: colors.textMuted, fontSize: 13 },
  changeValue: { color: colors.text, fontSize: 20, fontFamily: fonts.display },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { color: colors.accentStrong, fontSize: 13, fontWeight: '700' },
  stepText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, paddingTop: 3 },
});
