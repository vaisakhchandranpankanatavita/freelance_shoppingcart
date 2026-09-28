import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';

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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Preview</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.receipt}>
          <View style={styles.successBadge}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.successText}>Payment Successful</Text>
          </View>

          <Text style={styles.storeName}>{STORE.name}</Text>
          <Text style={styles.storeMeta}>{STORE.address}</Text>
          <Text style={styles.storeMeta}>{STORE.phone}  •  GSTIN: {STORE.gstin}</Text>

          <View style={styles.divider} />

          <View style={styles.metaRow}><Text style={styles.metaLabel}>Invoice</Text><Text style={styles.metaValue}>{invoiceId}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Date</Text><Text style={styles.metaValue}>{date}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Customer</Text><Text style={styles.metaValue}>{customer}{phone ? ` • ${phone}` : ''}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Delivery</Text><Text style={styles.metaValue}>{DELIVERY_LABELS[delivery] || delivery}</Text></View>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>Payment</Text><Text style={styles.metaValue}>{PAYMENT_LABELS[paymentMethod] || mode}</Text></View>

          <View style={styles.divider} />

          <View style={styles.itemHeader}>
            <Text style={[styles.itemCell, { flex: 2 }]}>Item</Text>
            <Text style={[styles.itemCell, styles.itemRight]}>Qty</Text>
            <Text style={[styles.itemCell, styles.itemRight]}>Price</Text>
            <Text style={[styles.itemCell, styles.itemRight]}>Total</Text>
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

          <View style={styles.totalsRow}><Text style={styles.totalsLabel}>Subtotal ({items} items)</Text><Text style={styles.totalsValue}>₹{Number(total).toFixed(2)}</Text></View>
          <View style={styles.totalsRow}><Text style={styles.totalsLabel}>Tax (5%)</Text><Text style={styles.totalsValue}>₹{tax.toFixed(2)}</Text></View>
          <View style={[styles.totalsRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>₹{grand.toFixed(2)}</Text>
          </View>

          <Text style={styles.thanks}>Thank you for shopping with us!</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onPrint} activeOpacity={0.85}>
          <Ionicons name="print-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.actionText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onSavePdf} activeOpacity={0.85}>
          <Ionicons name="document-text-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.actionText}>Save PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onShare} activeOpacity={0.85}>
          <Ionicons name="share-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.doneBtn]}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionText, { color: '#fff' }]}>Done</Text>
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
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.primaryDark },

  scroll: { padding: spacing.md, paddingBottom: 140 },
  receipt: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  successText: { color: colors.success, fontWeight: '700', fontSize: 13 },

  storeName: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  storeMeta: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 2 },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },

  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaLabel: { color: colors.textMuted, fontSize: 12 },
  metaValue: { color: colors.text, fontSize: 12, fontWeight: '600' },

  itemHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  itemRow: { flexDirection: 'row', paddingVertical: 6 },
  itemCell: { flex: 1, fontSize: 12, color: colors.text },
  itemRight: { textAlign: 'right' },
  emptyText: { color: colors.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: spacing.md },

  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: colors.textMuted, fontSize: 13 },
  totalsValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  grandRow: {
    borderTopWidth: 2,
    borderTopColor: colors.text,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  grandLabel: { color: colors.text, fontWeight: '800', fontSize: 15 },
  grandValue: { color: colors.primaryDark, fontWeight: '800', fontSize: 16 },

  thanks: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: spacing.md },

  actions: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneBtn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  actionText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
});
