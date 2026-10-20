import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import IconButton from '../../components/IconButton';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing, radius, fonts } from '../../theme';
import { enter, fadeIn, fadeOut, layout } from '../../theme/motion';
import { addPurchase, editPurchase, getPurchaseEditForm, getPurchaseForm, removePurchase } from './services';
import { useAuth } from '../../context/AuthContext';
import { plural, rupees } from '../../utils/format';

export default function AddPurchaseScreen({ navigation, route }) {
  const purchaseId = route?.params?.purchaseId;
  const isEdit = purchaseId != null;
  const { toast, confirm } = useFeedback();
  const { can } = useAuth();
  const canDelete = can('delete', 'purchase');
  const today = new Date().toISOString().slice(0, 10);
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(today);
  const [amountPaid, setAmountPaid] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ suppliers: [], branches: [], products: [], categories: [] });
  const [formError, setFormError] = useState('');
  const [cart, setCart] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPurchaseForm()
      .then(setForm)
      .catch((e) => setFormError(e.message || 'Could not load suppliers and products.'));
    if (isEdit) {
      getPurchaseEditForm(purchaseId)
        .then((f) => {
          setSupplierId(f.supplierId);
          setBranchId(f.branchId);
          setCategoryId(f.categoryId);
          setInvoiceNo(f.invoiceNo);
          if (f.date) setDate(f.date);
          if (f.amountPaid) {
            setAmountPaid(String(f.amountPaid));
            paidTouched.current = true;
          }
          setCart(f.cart);
        })
        .catch((e) => setFormError(e.message || 'Could not load this purchase order.'));
    }
  }, [isEdit, purchaseId]);

  const filtered = useMemo(
    () => form.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [form.products, search]
  );

  const addToCart = (item) => {
    setCart((c) => {
      const exists = c.find((x) => x.id === item.id);
      if (exists) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });
    if (errors.cart) setErrors((e) => ({ ...e, cart: undefined }));
  };

  const changeQty = (id, delta) => {
    setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x)).filter((x) => x.qty > 0));
  };

  const removeFromCart = (id) => {
    setCart((c) => c.filter((x) => x.id !== id));
  };

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const items = cart.reduce((s, i) => s + i.qty, 0);

  // Defaults "Amount paid" to the running total — most purchase orders are paid in full on
  // receipt — but only while the user hasn't typed their own figure (e.g. a part-payment).
  const paidTouched = useRef(false);
  useEffect(() => {
    if (!paidTouched.current) setAmountPaid(total > 0 ? String(total) : '');
  }, [total]);

  const onSave = async () => {
    const next = {};
    if (!supplierId) next.supplier = 'Choose a supplier';
    if (!branchId) next.branch = 'Choose a branch';
    if (!categoryId) next.category = 'Choose a category';
    if (!invoiceNo.trim()) next.invoiceNo = 'Enter the invoice number';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Use the format YYYY-MM-DD';
    if (!(Number(amountPaid) >= 0)) next.amountPaid = 'Enter an amount';
    if (cart.length === 0) next.cart = 'Add at least one product';
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload = {
      supplierId,
      branchId,
      categoryId,
      invoiceNo: invoiceNo.trim(),
      date,
      cart,
      amountPaid: Number(amountPaid),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await editPurchase(purchaseId, payload);
        toast({ tone: 'success', title: 'Purchase order updated' });
      } else {
        await addPurchase(payload);
        const supplierName = form.suppliers.find((s) => s.value === supplierId)?.label ?? '';
        toast({ tone: 'success', title: 'Purchase order created', message: `${supplierName} · ${rupees(total)}` });
      }
      navigation.goBack();
    } catch (e) {
      // Maps the backend's (or buildPayload's own pre-check — see services.js) error keys onto
      // the matching field so the problem shows up next to the right input, not just in a toast.
      if (e.errors) {
        const next = {};
        if (Object.keys(e.errors).some((k) => k.startsWith('supplier.'))) next.supplier = e.message;
        if (e.errors.branch_id || e.errors.gstin) next.branch = e.message;
        if (e.errors.invoice_no) next.invoiceNo = [].concat(e.errors.invoice_no)[0];
        if (e.errors.invoice_date) next.date = [].concat(e.errors.invoice_date)[0];
        if (e.errors.category) next.category = [].concat(e.errors.category)[0];
        if (e.errors.itemAmountPaid) next.amountPaid = [].concat(e.errors.itemAmountPaid)[0];
        if (Object.keys(next).length) setErrors((prev) => ({ ...prev, ...next }));
      }
      toast({ tone: 'error', title: "Couldn't save the order", message: e.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Delete purchase order?',
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await removePurchase(purchaseId);
      toast({ tone: 'success', title: 'Purchase order deleted' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't delete", message: e.message || 'Try again.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Screen
      bottomSheet={!isEdit}
      header={
        <ScreenHeader
          title={isEdit ? 'Edit purchase order' : 'New purchase order'}
          backIcon={!isEdit ? 'close' : 'arrow-back'}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {formError ? <Text style={styles.catalogError}>{formError}</Text> : null}

          <SectionCard title="Order details" icon="receipt-outline" index={0}>
            <SelectField
              label="Supplier"
              icon="business-outline"
              placeholder="Choose supplier"
              value={supplierId}
              options={form.suppliers}
              onChange={(v) => {
                setSupplierId(v);
                if (errors.supplier) setErrors((e) => ({ ...e, supplier: undefined }));
              }}
              error={errors.supplier}
            />

            <View style={styles.row}>
              <SelectField
                style={styles.cell}
                label="Branch"
                icon="storefront-outline"
                placeholder="Choose branch"
                value={branchId}
                options={form.branches}
                onChange={(v) => {
                  setBranchId(v);
                  if (errors.branch) setErrors((e) => ({ ...e, branch: undefined }));
                }}
                error={errors.branch}
              />
              <SelectField
                style={styles.cell}
                label="Category"
                icon="albums-outline"
                placeholder="Choose category"
                value={categoryId}
                options={form.categories}
                onChange={(v) => {
                  setCategoryId(v);
                  if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                }}
                error={errors.category}
              />
            </View>

            <View style={[styles.row, styles.rowSpacing]}>
              <InputField
                style={styles.cell}
                label="Invoice no."
                icon="document-text-outline"
                placeholder="e.g. INV-1042"
                value={invoiceNo}
                error={errors.invoiceNo}
                onChangeText={(v) => {
                  setInvoiceNo(v);
                  if (errors.invoiceNo) setErrors((e) => ({ ...e, invoiceNo: undefined }));
                }}
              />
              <InputField
                style={styles.cell}
                label="Invoice date"
                icon="calendar-outline"
                placeholder="YYYY-MM-DD"
                value={date}
                error={errors.date}
                onChangeText={setDate}
              />
            </View>
          </SectionCard>

          <Animated.View entering={enter(1)} style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products to add"
              placeholderTextColor={colors.textFaint}
              value={search}
              onChangeText={setSearch}
              accessibilityLabel="Search products"
            />
          </Animated.View>

          {cart.length > 0 && (
            <Animated.View entering={fadeIn()} exiting={fadeOut} layout={layout}>
              <Text style={styles.sectionTitle}>Items</Text>
              {cart.map((item) => (
                <Animated.View key={item.id} entering={fadeIn()} exiting={fadeOut} layout={layout} style={styles.cartRowWrap}>
                  <Swipeable
                    renderRightActions={() => (
                      <PressableScale
                        style={styles.swipeDelete}
                        onPress={() => removeFromCart(item.id)}
                        accessibilityLabel={`Delete ${item.name} from order`}
                      >
                        <Icon name="trash-outline" size={20} color={colors.onAccent} />
                      </PressableScale>
                    )}
                    overshootRight={false}
                    rightThreshold={40}
                  >
                    <View style={styles.cartRow}>
                      <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                      <IconButton icon="remove" size={28} variant="soft" onPress={() => changeQty(item.id, -1)} accessibilityLabel={`Remove one ${item.name}`} />
                      <Text style={styles.qty}>{item.qty}</Text>
                      <IconButton icon="add" size={28} variant="soft" onPress={() => changeQty(item.id, 1)} accessibilityLabel={`Add one ${item.name}`} />
                      <Text style={styles.lineTotal}>₹{item.qty * item.price}</Text>
                      <PressableScale
                        style={styles.rowDeleteBtn}
                        scaleTo={0.9}
                        hitSlop={6}
                        onPress={() => removeFromCart(item.id)}
                        accessibilityLabel={`Delete ${item.name} from order`}
                      >
                        <Icon name="trash-outline" size={18} color={colors.danger} />
                      </PressableScale>
                    </View>
                  </Swipeable>
                </Animated.View>
              ))}
            </Animated.View>
          )}
          {errors.cart ? <Text style={styles.cartErrorText}>{errors.cart}</Text> : null}

          <Animated.View layout={layout}>
            <Text style={styles.sectionTitle}>Products</Text>
            {filtered.map((item, i) => (
              <Animated.View key={item.id} entering={enter(i + 2)} layout={layout}>
                <PressableScale
                  scaleTo={0.97}
                  style={styles.productRow}
                  onPress={() => addToCart(item)}
                  accessibilityLabel={`Add ${item.name} to order`}
                >
                  <View style={styles.thumb}>
                    <Icon name="cube-outline" size={18} color={colors.text} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.productPrice}>₹{item.price}</Text>
                  </View>
                  <View style={styles.plusBtn}>
                    <Icon name="add" size={18} color={colors.onAccent} />
                  </View>
                </PressableScale>
              </Animated.View>
            ))}
          </Animated.View>

          <SectionCard title="Payment" icon="cash-outline" index={4}>
            <InputField
              label="Amount paid now"
              icon="cash-outline"
              placeholder="0"
              value={amountPaid}
              error={errors.amountPaid}
              keyboardType="numeric"
              onChangeText={(v) => {
                paidTouched.current = true;
                setAmountPaid(v);
                if (errors.amountPaid) setErrors((e) => ({ ...e, amountPaid: undefined }));
              }}
            />
            {total > 0 ? (
              <Text style={styles.dueHint}>Due: {rupees(Math.max(total - (Number(amountPaid) || 0), 0))}</Text>
            ) : null}
          </SectionCard>

          {isEdit && canDelete ? (
            <Animated.View entering={enter(3)}>
              <PressableScale style={styles.delete} onPress={onDelete} accessibilityLabel="Delete purchase order">
                <Icon name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete purchase order'}</Text>
              </PressableScale>
            </Animated.View>
          ) : null}
        </ScrollView>

        <Animated.View entering={enter(5)} style={styles.footer}>
          <Text style={styles.footerTotal}>{plural(items, 'item')} · {rupees(total)}</Text>
          <PrimaryButton title={isEdit ? 'Save changes' : 'Create order'} icon="checkmark" variant="light" onPress={onSave} loading={saving} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.sm, paddingBottom: spacing.lg },
  sectionTitle: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4, marginLeft: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowSpacing: { marginTop: spacing.sm },
  cell: { flex: 1 },
  dueHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginLeft: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.text, paddingVertical: 0, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  catalogError: { color: colors.dangerStrong, fontSize: 13, marginLeft: spacing.sm, marginBottom: spacing.sm },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  thumb: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.elevated3, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.text },
  productPrice: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  plusBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  cartRowWrap: { marginBottom: spacing.xs, borderRadius: radius.md, overflow: 'hidden' },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
  },
  rowDeleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  swipeDelete: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
  },
  cartName: { flex: 1, color: colors.ink, fontSize: 14, fontFamily: fonts.bodySemiBold },
  qty: { minWidth: 22, textAlign: 'center', fontFamily: fonts.display, color: colors.ink },
  lineTotal: { minWidth: 60, textAlign: 'right', fontFamily: fonts.display, color: colors.ink },
  cartErrorText: { color: colors.dangerStrong, fontSize: 12, fontFamily: fonts.bodySemiBold, marginBottom: spacing.sm, marginLeft: spacing.sm },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.elevated2,
  },
  deleteText: { color: colors.dangerStrong, fontFamily: fonts.bodyBold, fontSize: 15 },
  // paddingBottom clears the floating TabBar (position:'absolute', bottom:0 in TabBar.js),
  // which otherwise overlaps this Save button since this screen sits inside PurchaseNavigator's tab stack.
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.inkLine,
  },
  footerTotal: { textAlign: 'center', color: colors.textMuted, fontSize: 13, fontFamily: fonts.bodySemiBold },
});
