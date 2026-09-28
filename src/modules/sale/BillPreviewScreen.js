import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
  Alert,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import Heading from '../../components/Heading';
import { colors, spacing, radius } from '../../theme';
import { enter } from '../../theme/motion';

const DELIVERY_LABELS = {
  pickup: 'Store Pickup',
  home: 'Home Delivery',
  express: 'Express',
};

const PAYMENT_LABELS = {
  wallet: 'Wallet',
  cod: 'Pay On Delivery',
  'card-mc': 'Mastercard •••• 4975',
  'card-visa': 'Visa •••• 4975',
  'bank-sbi': 'SBI Net Banking',
  'bank-hdfc': 'HDFC Net Banking',
};

const STORE = {
  name: 'Grocery Store',
  address: '12 Market Street, Bengaluru 560001',
  phone: '+91 98765 43210',
  gstin: '29ABCDE1234F1Z5',
};

export default function BillPreviewScreen({ route, navigation }) {
  const {
    invoiceId = `INV-${Date.now().toString().slice(-6)}`,
    date = new Date().toISOString().slice(0, 10),
    customer = 'Walk-in',
    phone = '',
    delivery = 'pickup',
    mode = 'Cash',
    paymentMethod = 'wallet',
    cart = [],
    items = 0,
    total = 0,
  } = route.params || {};

  const tax = useMemo(() => +(total * 0.05).toFixed(2), [total]);
  const grand = useMemo(() => +(total + tax).toFixed(2), [total, tax]);

  const buildHtml = () => `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>${invoiceId}</title>
<style>
  * { box-sizing: border-box; font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { padding: 24px; color: #111; }
  h1 { margin: 0; font-size: 20px; }
  .muted { color: #6B7280; font-size: 12px; }
  .row { display: flex; justify-content: space-between; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 8px 4px; border-bottom: 1px dashed #ddd; font-size: 13px; }
  th:last-child, td:last-child { text-align: right; }
  .totals { margin-top: 12px; }
  .totals .row.grand { font-weight: 800; font-size: 16px; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #6B7280; }
</style></head>
<body>
  <h1>${STORE.name}</h1>
  <div class="muted">${STORE.address}</div>
  <div class="muted">${STORE.phone} • GSTIN: ${STORE.gstin}</div>
  <hr/>
  <div class="row"><strong>Invoice</strong><span>${invoiceId}</span></div>
  <div class="row"><span class="muted">Date</span><span>${date}</span></div>
  <div class="row"><span class="muted">Customer</span><span>${customer}${phone ? ' • ' + phone : ''}</span></div>
  <div class="row"><span class="muted">Delivery</span><span>${DELIVERY_LABELS[delivery] || delivery}</span></div>
  <div class="row"><span class="muted">Payment</span><span>${PAYMENT_LABELS[paymentMethod] || mode}</span></div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      ${cart.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${(i.qty * i.price).toFixed(2)}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal (${items} items)</span><span>₹${Number(total).toFixed(2)}</span></div>
    <div class="row"><span>Tax (5%)</span><span>₹${tax.toFixed(2)}</span></div>
    <div class="row grand"><span>Grand Total</span><span>₹${grand.toFixed(2)}</span></div>
  </div>
  <div class="footer">Thank you for shopping with us!</div>
</body></html>`;

  const openPrintWindow = () => {
    if (Platform.OS !== 'web') return false;
    const w = window.open('', '_blank');
    if (!w) {
      Alert.alert('Popup blocked', 'Allow popups to open the print preview.');
      return false;
    }
    w.document.open();
    w.document.write(buildHtml());
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
    return true;
  };

  const onPrint = () => {
    if (openPrintWindow()) return;
    Alert.alert(
      'Print not available',
      'On device, install expo-print to enable native printing.\n\nRun: npx expo install expo-print'
    );
  };

  const onSavePdf = () => {
    if (openPrintWindow()) return;
    Alert.alert(
      'Save as PDF',
      'On device, install expo-print + expo-sharing to export a PDF.\n\nRun: npx expo install expo-print expo-sharing'
    );
  };

  const buildTextReceipt = () =>
    [
      `${STORE.name}`,
      `Invoice: ${invoiceId}   Date: ${date}`,
      `Customer: ${customer}${phone ? ' • ' + phone : ''}`,
      `Delivery: ${DELIVERY_LABELS[delivery] || delivery}`,
      `Payment: ${PAYMENT_LABELS[paymentMethod] || mode}`,
      '',
      ...cart.map((i) => `${i.name}  x${i.qty}   ₹${(i.qty * i.price).toFixed(2)}`),
      '',
      `Subtotal: ₹${Number(total).toFixed(2)}`,
      `Tax (5%): ₹${tax.toFixed(2)}`,
      `Grand Total: ₹${grand.toFixed(2)}`,
    ].join('\n');

  const onShare = async () => {
    try {
      await Share.share({ title: invoiceId, message: buildTextReceipt() });
    } catch (e) {
      Alert.alert('Share failed', e.message || 'Try again.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Bill preview" backIcon="close" onBack={() => navigation.popToTop()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.springify().damping(14).stiffness(180)} style={styles.successBadge}>
          <Icon name="checkmark" size={30} color={colors.ink} />
        </Animated.View>
        <Heading level="h2" entering={enter(1)} style={styles.successText}>
          Payment successful
        </Heading>

        <Animated.View entering={enter(2)} style={styles.receipt}>
          <Text style={styles.storeName}>{STORE.name}</Text>
          <Text style={styles.storeMeta}>{STORE.address}</Text>
          <Text style={styles.storeMeta}>{STORE.phone}  •  GSTIN: {STORE.gstin}</Text>

          <View style={styles.divider} />

          <Meta label="Invoice" value={invoiceId} />
          <Meta label="Date" value={date} />
          <Meta label="Customer" value={`${customer}${phone ? ` • ${phone}` : ''}`} />
          <Meta label="Delivery" value={DELIVERY_LABELS[delivery] || delivery} />
          <Meta label="Payment" value={PAYMENT_LABELS[paymentMethod] || mode} />

          <View style={styles.divider} />

          <View style={styles.itemHeader}>
            <Text style={[styles.itemHead, { flex: 2 }]}>Item</Text>
            <Text style={[styles.itemHead, styles.itemRight]}>Qty</Text>
            <Text style={[styles.itemHead, styles.itemRight]}>Price</Text>
            <Text style={[styles.itemHead, styles.itemRight]}>Total</Text>
          </View>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>No items on this bill.</Text>
          ) : (
            cart.map((i) => (
              <View key={i.id} style={styles.itemRow}>
                <Text style={[styles.itemCell, { flex: 2 }]} numberOfLines={1}>{i.name}</Text>
                <Text style={[styles.itemCell, styles.itemRight]}>{i.qty}</Text>
                <Text style={[styles.itemCell, styles.itemRight]}>₹{i.price}</Text>
                <Text style={[styles.itemCell, styles.itemRight]}>₹{(i.qty * i.price).toFixed(2)}</Text>
              </View>
            ))
          )}

          <View style={styles.divider} />

          <Meta label={`Subtotal (${items} items)`} value={`₹${Number(total).toFixed(2)}`} />
          <Meta label="Tax (5%)" value={`₹${tax.toFixed(2)}`} />
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Grand total</Text>
            <Text style={styles.grandValue}>₹{grand.toFixed(2)}</Text>
          </View>

          <Text style={styles.thanks}>Thank you for shopping with us!</Text>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={enter(4)} style={styles.actions}>
        <Action icon="print-outline" label="Print" onPress={onPrint} />
        <Action icon="document-text-outline" label="PDF" onPress={onSavePdf} />
        <Action icon="share-outline" label="Share" onPress={onShare} />
        <PrimaryButton title="Done" variant="light" onPress={() => navigation.popToTop()} style={{ flex: 1 }} />
      </Animated.View>
    </Screen>
  );
}

function Action({ icon, label, onPress }) {
  return (
    <PressableScale style={styles.actionBtn} onPress={onPress} accessibilityLabel={label} scaleTo={0.92}>
      <Icon name={icon} size={20} color={colors.text} />
      <Text style={styles.actionText}>{label}</Text>
    </PressableScale>
  );
}

function Meta({ label, value }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 130 },
  successBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  successText: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl },

  receipt: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl },
  storeName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, color: colors.ink, textAlign: 'center' },
  storeMeta: { fontSize: 12, color: colors.inkMuted, textAlign: 'center', marginTop: 2 },
  divider: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.inkLine,
    borderStyle: 'dashed',
    marginVertical: spacing.lg,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: spacing.md },
  metaLabel: { color: colors.inkMuted, fontSize: 13 },
  metaValue: { color: colors.ink, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  itemHeader: { flexDirection: 'row', paddingBottom: 6, marginBottom: 4 },
  itemHead: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.inkMuted },
  itemRow: { flexDirection: 'row', paddingVertical: 6 },
  itemCell: { flex: 1, fontSize: 13, color: colors.ink },
  itemRight: { textAlign: 'right' },
  emptyText: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.md },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.ink,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  grandLabel: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  grandValue: { color: colors.ink, fontWeight: '800', fontSize: 22, letterSpacing: -0.6 },
  thanks: { textAlign: 'center', color: colors.inkMuted, fontSize: 13, marginTop: spacing.xl },

  actions: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 64,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.elevated2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionText: { fontSize: 11, fontWeight: '600', color: colors.text },
});
