import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import PressableScale from '../../components/PressableScale';
import PrimaryButton from '../../components/PrimaryButton';
import { useFeedback } from '../../components/Feedback';
import Heading from '../../components/Heading';
import BottomBar from '../../components/BottomBar';
import Receipt, { Barcode, Perforation, mono } from '../../components/Receipt';
import { colors, spacing, radius, fonts } from '../../theme';
import { enter } from '../../theme/motion';
import { rupeesExact, shortDate } from '../../utils/format';
import { getStoreProfile } from './services';

const DELIVERY_LABELS = {
  pickup: 'Store pickup',
  home: 'Home delivery',
  express: 'Express',
};

// Customer and product names are typed by staff — escape them before they go into the print
// window's HTML.
const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);

export default function BillPreviewScreen({ route, navigation }) {
  const { toast } = useFeedback();
  const {
    invoiceId = `INV-${Date.now().toString().slice(-6)}`,
    date = new Date().toISOString().slice(0, 10),
    customer = 'Walk-in',
    phone = '',
    delivery = 'pickup',
    mode = 'Cash',
    cart = [],
    items = 0,
    total = 0,
    fee = 0,
    grand: charged,
    fromReprint = false,
  } = route.params || {};
  const [store, setStore] = useState(null);

  useEffect(() => {
    let live = true;
    getStoreProfile().then((s) => live && setStore(s)).catch(() => {});
    return () => { live = false; };
  }, []);

  // Fresh checkout: "Done"/close should clear the whole sale flow (popToTop). A reprint from
  // SaleDetailScreen should just return there, not dump the user out of their sale history.
  const dismiss = () => (fromReprint ? navigation.goBack() : navigation.popToTop());

  // The receipt shows exactly what was charged: items + delivery fee. Nothing is added on top —
  // the amount taken at checkout is final.
  const subtotal = useMemo(
    () => (cart.length ? cart.reduce((s, i) => s + i.qty * i.price, 0) : Number(total) || 0),
    [cart, total]
  );
  const deliveryFee = Number(fee) || 0;
  const grand = charged != null ? Number(charged) : subtotal + deliveryFee;
  // On a reprint the stored total can differ from items + delivery (tax, rounding, discount
  // applied by the backend) — show the difference so the receipt always adds up.
  const adjustment = Math.round((grand - subtotal - deliveryFee) * 100) / 100;
  const adjustmentLabel = adjustment > 0 ? 'Other charges' : 'Discount';
  const adjustmentValue = `${adjustment < 0 ? '−' : ''}${rupeesExact(Math.abs(adjustment))}`;
  const storeName = store?.name || 'Receipt';
  const storeLines = [
    store?.address,
    [store?.phone, store?.gstin && `GSTIN ${store.gstin}`].filter(Boolean).join('  •  '),
  ].filter(Boolean);
  const customerLine = `${customer || 'Walk-in'}${phone ? ` • ${phone}` : ''}`;
  const when = shortDate(date);

  // Same ink/muted/line tones as the in-app <Receipt> below (colors.paperInk/textMuted/
  // inkLine), so the printed bill reads as the same receipt, not a different one.
  const buildHtml = () => `<!doctype html>
<html><head><meta charset="utf-8"/>
<title>Bill ${esc(invoiceId)}</title>
<style>
  * { box-sizing: border-box; font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
  body { padding: 24px; color: ${colors.paperInk}; max-width: 420px; margin: 0 auto; }
  h1 { margin: 0; font-size: 20px; text-align: center; }
  .muted { color: ${colors.textMuted}; font-size: 12px; text-align: center; }
  .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 8px 4px; border-bottom: 1px dashed ${colors.inkLine}; font-size: 13px; }
  th:not(:first-child), td:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-top: 12px; }
  .totals .row.grand { font-weight: 800; font-size: 16px; border-top: 2px solid ${colors.paperInk}; padding-top: 8px; margin-top: 8px; }
  .footer { text-align: center; margin-top: 24px; font-size: 12px; color: ${colors.textMuted}; }
</style></head>
<body>
  <h1>${esc(storeName)}</h1>
  ${storeLines.map((l) => `<div class="muted">${esc(l)}</div>`).join('')}
  <hr/>
  <div class="row"><strong>Bill</strong><span>${esc(invoiceId)}</span></div>
  <div class="row"><span>Date</span><span>${esc(when)}</span></div>
  <div class="row"><span>Customer</span><span>${esc(customerLine)}</span></div>
  <div class="row"><span>Delivery</span><span>${esc(DELIVERY_LABELS[delivery] || delivery)}</span></div>
  <div class="row"><span>Payment</span><span>${esc(mode)}</span></div>
  <table>
    <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      ${cart.map((i) => `<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${rupeesExact(i.price)}</td><td>${rupeesExact(i.qty * i.price)}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal (${items} items)</span><span>${rupeesExact(subtotal)}</span></div>
    ${deliveryFee ? `<div class="row"><span>Delivery fee</span><span>${rupeesExact(deliveryFee)}</span></div>` : ''}
    ${adjustment ? `<div class="row"><span>${adjustmentLabel}</span><span>${adjustmentValue}</span></div>` : ''}
    <div class="row grand"><span>Total paid</span><span>${rupeesExact(grand)}</span></div>
  </div>
  <div class="footer">Thank you for shopping with us</div>
</body></html>`;

  // Web opens a print window (its dialog can also save a PDF); devices need expo-print (not installed yet).
  const printBill = () => {
    if (Platform.OS !== 'web') {
      toast({ tone: 'info', title: 'Printing is not set up on this device', message: 'Share the bill instead.' });
      return;
    }
    const w = window.open('', '_blank');
    if (!w) {
      toast({ tone: 'error', title: 'Popup blocked', message: 'Allow popups to open the print preview.' });
      return;
    }
    w.document.open();
    w.document.write(buildHtml());
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  const buildTextReceipt = () =>
    [
      storeName,
      `Bill ${invoiceId}  •  ${when}`,
      `Customer: ${customerLine}`,
      `Payment: ${mode}`,
      '',
      ...cart.map((i) => `${i.name}  x${i.qty}   ${rupeesExact(i.qty * i.price)}`),
      '',
      `Subtotal: ${rupeesExact(subtotal)}`,
      ...(deliveryFee ? [`Delivery fee: ${rupeesExact(deliveryFee)}`] : []),
      ...(adjustment ? [`${adjustmentLabel}: ${adjustmentValue}`] : []),
      `Total paid: ${rupeesExact(grand)}`,
    ].join('\n');

  const onShare = async () => {
    try {
      await Share.share({ title: `Bill ${invoiceId}`, message: buildTextReceipt() });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't share the bill", message: e.message || 'Try again.' });
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title={fromReprint ? `Bill ${invoiceId}` : 'Bill'}
          backIcon={fromReprint ? 'arrow-back' : 'close'}
          onBack={dismiss}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {fromReprint ? null : (
          <>
            <Animated.View entering={ZoomIn.springify().damping(14).stiffness(180)} style={styles.successBadge}>
              <Icon name="checkmark" size={30} color={colors.ink} />
            </Animated.View>
            <Heading level="h2" entering={enter(1)} style={styles.successText}>
              {rupeesExact(grand)} received
            </Heading>
          </>
        )}

        <Receipt style={styles.receipt}>
          <Text style={styles.storeName}>{storeName}</Text>
          {storeLines.map((l) => (
            <Text key={l} style={styles.storeMeta}>{l}</Text>
          ))}

          <Perforation />

          <Meta label="Bill" value={invoiceId} />
          <Meta label="Date" value={when} />
          <Meta label="Customer" value={customerLine} />
          <Meta label="Delivery" value={DELIVERY_LABELS[delivery] || delivery} />
          <Meta label="Payment" value={mode} />

          <Perforation />

          <View style={styles.itemHeader}>
            <Text style={[styles.itemHead, { flex: 2 }]}>Item</Text>
            <Text style={[styles.itemHead, styles.itemRight]}>Qty</Text>
            <Text style={[styles.itemHead, styles.itemRight]}>Price</Text>
            <Text style={[styles.itemHead, styles.itemRight]}>Total</Text>
          </View>
          {cart.length === 0 ? (
            <Text style={styles.emptyText}>Item breakdown isn't available for this bill.</Text>
          ) : (
            cart.map((i) => (
              <View key={i.id} style={styles.itemRow}>
                <Text style={[styles.itemCell, { flex: 2, fontFamily: undefined }]} numberOfLines={2}>{i.name}</Text>
                <Text style={[styles.itemCell, styles.itemRight]}>{i.qty}</Text>
                <Text style={[styles.itemCell, styles.itemRight]}>{i.price}</Text>
                <Text style={[styles.itemCell, styles.itemRight]}>{(i.qty * i.price).toFixed(2)}</Text>
              </View>
            ))
          )}

          <Perforation />

          <Meta label={`Subtotal (${items} items)`} value={rupeesExact(subtotal)} />
          {deliveryFee ? <Meta label="Delivery fee" value={rupeesExact(deliveryFee)} /> : null}
          {adjustment ? <Meta label={adjustmentLabel} value={adjustmentValue} /> : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total paid</Text>
            <Text style={styles.grandValue}>{rupeesExact(grand)}</Text>
          </View>

          <Perforation />
          <Barcode value={String(invoiceId).replace(/\D/g, '') || '0'} />
          <Text style={styles.thanks}>Thank you for shopping with us</Text>
        </Receipt>
      </ScrollView>

      {/* bottom clears the floating TabBar (position:'absolute', bottom:0), same convention as
          DashboardScreen's BottomBar - this screen sits inside SaleNavigator's tab stack. */}
      <BottomBar>
        <View style={styles.actions}>
          <Action icon="print-outline" label="Print" onPress={printBill} />
          <Action icon="share-outline" label="Share" onPress={onShare} />
          <PrimaryButton title="Done" variant="light" onPress={dismiss} style={{ flex: 1 }} />
        </View>
      </BottomBar>
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
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: 150 },
  successBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  successText: { textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.xl },

  receipt: { marginHorizontal: 0 },
  storeName: { fontSize: 24, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.paperInk, textAlign: 'center' },
  storeMeta: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: spacing.md },
  metaLabel: { color: colors.textMuted, fontSize: 13 },
  metaValue: { color: colors.paperInk, fontSize: 13, fontFamily: fonts.bodySemiBold, flexShrink: 1, textAlign: 'right' },
  itemHeader: { flexDirection: 'row', paddingBottom: 6, marginBottom: 4 },
  itemHead: { flex: 1, fontSize: 12, fontFamily: fonts.bodyBold, color: colors.textMuted },
  itemRow: { flexDirection: 'row', paddingVertical: 6 },
  itemCell: { flex: 1, fontSize: 13, color: colors.paperInk, fontFamily: mono, fontVariant: ['tabular-nums'] },
  itemRight: { textAlign: 'right' },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.md },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.paperInk,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  grandLabel: { color: colors.paperInk, fontFamily: fonts.display, fontSize: 16 },
  grandValue: { color: colors.paperInk, fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.6 },
  thanks: { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: spacing.md },

  actions: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionBtn: {
    width: 56,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.elevated2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionText: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.text },
});
