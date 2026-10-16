import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import IconButton from '../../components/IconButton';
import EmptyState from '../../components/EmptyState';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing, radius, fonts } from '../../theme';
import { enter, fadeIn, fadeOut, layout } from '../../theme/motion';
import {
  BACKEND_READY,
  addRequest,
  convertRequest,
  editRequest,
  getRequestEditForm,
  getRequestForm,
  removeRequest,
} from './services';

export default function PurchaseRequestFormScreen({ navigation, route }) {
  const requestId = route?.params?.requestId;
  const isEdit = requestId != null;
  const { toast, confirm } = useFeedback();
  const today = new Date().toISOString().slice(0, 10);
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState('Pending');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ suppliers: [], branches: [], products: [] });
  const [formError, setFormError] = useState('');
  const [cart, setCart] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!BACKEND_READY) return;
    getRequestForm()
      .then(setForm)
      .catch((e) => setFormError(e.message || 'Could not load suppliers and products.'));
    if (isEdit) {
      getRequestEditForm(requestId)
        .then((f) => {
          setSupplierId(f.supplierId);
          setBranchId(f.branchId);
          if (f.date) setDate(f.date);
          setStatus(f.status);
          setCart(f.cart);
        })
        .catch((e) => setFormError(e.message || 'Could not load this request.'));
    }
  }, [isEdit, requestId]);

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

  const items = cart.reduce((s, i) => s + i.qty, 0);

  const onSave = async () => {
    const next = {};
    if (!supplierId) next.supplier = 'Choose a supplier';
    if (form.branches.length && !branchId) next.branch = 'Choose a branch';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Use the format YYYY-MM-DD';
    if (cart.length === 0) next.cart = 'Add at least one product';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (isEdit) {
        await editRequest(requestId, { supplierId, branchId, date, cart });
        toast({ tone: 'success', title: 'Request updated' });
      } else {
        await addRequest({ supplierId, branchId, date, cart });
        toast({ tone: 'success', title: 'Purchase request raised' });
      }
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't save the request", message: e.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({ title: 'Delete request?', message: 'This cannot be undone.', confirmLabel: 'Delete', destructive: true });
    if (!ok) return;
    setDeleting(true);
    try {
      await removeRequest(requestId);
      toast({ tone: 'success', title: 'Request deleted' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't delete", message: e.message || 'Try again.' });
    } finally {
      setDeleting(false);
    }
  };

  const onConvert = async () => {
    const ok = await confirm({
      title: 'Convert to purchase order?',
      message: 'This will create a purchase order from this request.',
      confirmLabel: 'Convert',
    });
    if (!ok) return;
    setConverting(true);
    try {
      await convertRequest(requestId);
      toast({ tone: 'success', title: 'Converted to purchase order' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't convert", message: e.message || 'Try again.' });
    } finally {
      setConverting(false);
    }
  };

  if (!BACKEND_READY) {
    return (
      <Screen
        header={
          <ScreenHeader
            title={isEdit ? 'Edit request' : 'New purchase request'}
            backIcon={!isEdit ? 'close' : 'arrow-back'}
            onBack={() => navigation.goBack()}
          />
        }
      >
        <View style={{ paddingTop: HEADER_HEIGHT + spacing.lg }}>
          <EmptyState
            tone="locked"
            icon="lock-closed-outline"
            title="Purchase requests"
            message="This feature unlocks as soon as the backend ships support for it. The screen is ready and will go live automatically."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      bottomSheet={!isEdit}
      header={
        <ScreenHeader
          title={isEdit ? 'Edit request' : 'New purchase request'}
          backIcon={!isEdit ? 'close' : 'arrow-back'}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {formError ? <Text style={styles.catalogError}>{formError}</Text> : null}

          <Animated.View entering={enter(0)}>
            <SelectField
              label="Supplier"
              icon="business-outline"
              placeholder="Choose supplier"
              value={supplierId}
              options={form.suppliers}
              onChange={(v) => { setSupplierId(v); if (errors.supplier) setErrors((e) => ({ ...e, supplier: undefined })); }}
              error={errors.supplier}
            />
          </Animated.View>

          {form.branches.length ? (
            <Animated.View entering={enter(1)}>
              <SelectField
                label="Branch"
                icon="storefront-outline"
                placeholder="Choose branch"
                value={branchId}
                options={form.branches}
                onChange={(v) => { setBranchId(v); if (errors.branch) setErrors((e) => ({ ...e, branch: undefined })); }}
                error={errors.branch}
              />
            </Animated.View>
          ) : null}

          <Animated.View entering={enter(2)}>
            <InputField label="Request date" icon="calendar-outline" placeholder="YYYY-MM-DD" value={date} error={errors.date} onChangeText={setDate} />
          </Animated.View>

          <Animated.View entering={enter(3)} style={styles.searchBox}>
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
                <Animated.View key={item.id} entering={fadeIn()} exiting={fadeOut} layout={layout} style={styles.cartRow}>
                  <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                  <IconButton icon="remove" size={32} variant="soft" onPress={() => changeQty(item.id, -1)} accessibilityLabel={`Remove one ${item.name}`} />
                  <Text style={styles.qty}>{item.qty}</Text>
                  <IconButton icon="add" size={32} variant="soft" onPress={() => changeQty(item.id, 1)} accessibilityLabel={`Add one ${item.name}`} />
                </Animated.View>
              ))}
            </Animated.View>
          )}
          {errors.cart ? <Text style={styles.cartErrorText}>{errors.cart}</Text> : null}

          <Animated.View layout={layout}>
            <Text style={styles.sectionTitle}>Products</Text>
            {filtered.map((item, i) => (
              <Animated.View key={item.id} entering={enter(i + 4)} layout={layout}>
                <PressableScale scaleTo={0.97} style={styles.productRow} onPress={() => addToCart(item)} accessibilityLabel={`Add ${item.name}`}>
                  <View style={styles.thumb}>
                    <Icon name="cube-outline" size={18} color={colors.text} />
                  </View>
                  <Text style={[styles.productName, { flex: 1, marginLeft: spacing.md }]} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.plusBtn}>
                    <Icon name="add" size={18} color={colors.onAccent} />
                  </View>
                </PressableScale>
              </Animated.View>
            ))}
          </Animated.View>

          {isEdit && status !== 'Converted' ? (
            <Animated.View entering={enter(6)}>
              <PressableScale style={styles.convert} onPress={onConvert} accessibilityLabel="Convert to purchase order">
                <Icon name="swap-horizontal-outline" size={18} color={colors.ink} />
                <Text style={styles.convertText}>{converting ? 'Converting…' : 'Convert to purchase order'}</Text>
              </PressableScale>
            </Animated.View>
          ) : null}

          {isEdit ? (
            <Animated.View entering={enter(7)}>
              <PressableScale style={styles.delete} onPress={onDelete} accessibilityLabel="Delete request">
                <Icon name="trash-outline" size={18} color={colors.danger} />
                <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete request'}</Text>
              </PressableScale>
            </Animated.View>
          ) : null}
        </ScrollView>

        <Animated.View entering={enter(5)} style={styles.footer}>
          <Text style={styles.footerTotal}>{items} item{items === 1 ? '' : 's'}</Text>
          <PrimaryButton title={isEdit ? 'Save changes' : 'Raise request'} icon="checkmark" variant="light" onPress={onSave} loading={saving} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: spacing.xl },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, marginLeft: spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated2, height: 52, borderRadius: radius.pill, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text, paddingVertical: 0, ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }) },
  catalogError: { color: colors.dangerStrong, fontSize: 13, marginLeft: spacing.sm, marginBottom: spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  thumb: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.elevated3, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '600', color: colors.text },
  plusBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, padding: spacing.md, paddingLeft: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.sm },
  cartName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600' },
  qty: { minWidth: 22, textAlign: 'center', fontFamily: fonts.display, color: colors.ink },
  cartErrorText: { color: colors.dangerStrong, fontSize: 12, fontWeight: '600', marginBottom: spacing.sm, marginLeft: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.inkLine,
  },
  footerTotal: { textAlign: 'center', color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  convert: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, height: 52, borderRadius: radius.pill, backgroundColor: colors.chip },
  convertText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, height: 52, borderRadius: radius.pill, backgroundColor: colors.elevated2 },
  deleteText: { color: colors.dangerStrong, fontWeight: '700', fontSize: 15 },
});
