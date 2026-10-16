import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SharedBadge from '../../components/SharedBadge';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';
import { useFeedback } from '../../components/Feedback';
import { useAuth } from '../../context/AuthContext';
import {
  deleteProduct,
  getBranches,
  getBranchStock,
  getProduct,
  updateProduct,
  updateVariantStock,
} from '../../api';
import { listOf, toOptions } from '../manage/entities';
import { toItem } from './mappers';
import { colors, radius, spacing } from '../../theme';
import { enter } from '../../theme/motion';

const str = (v) => (v == null ? '' : String(v));
const pick = (o, keys) => str(keys.map((k) => o?.[k]).find((v) => v != null && v !== ''));

// Edit, delete and per-branch stock for one product (variants share the product's screen).
// Field names are best guesses like the rest of the stock module — see ./mappers.js.
export default function ProductDetailScreen({ navigation, route }) {
  const { productId, name: initialName } = route.params;
  const { toast, confirm } = useFeedback();
  const { can } = useAuth();
  const canDelete = can('delete', 'product');
  const canUpdate = can('update', 'product');
  const [form, setForm] = useState({ name: initialName ?? '', price: '', lowAt: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [stock, setStock] = useState([]); // [{ id, label, qty, original }]
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const p = toItem(await getProduct(productId));
      // `item_name` is the confirmed key (see stock/mappers.js's productName, sourced from a
      // live GET /products response) — `pick(p, ['name'])` alone left this blank on every edit.
      setForm({
        name: pick(p, ['item_name', 'name']),
        price: pick(p, ['selling_price', 'price', 'sale_price']),
        lowAt: pick(p, ['low_stock_alert', 'alert_quantity']),
      });
    } catch (e) {
      setLoadError(e.message || 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    getBranches().then((res) => setBranches(toOptions(res))).catch(() => setBranches([]));
  }, []);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSave = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter the item name';
    if (!(Number(form.price) > 0)) next.price = 'Enter a price';
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await updateProduct(productId, {
        item_name: form.name.trim(),
        name: form.name.trim(),
        selling_price: Number(form.price),
        price: Number(form.price),
        low_stock_alert: Number(form.lowAt || 5),
      });
      toast({ tone: 'success', title: 'Item updated' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't update the item", message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Delete item?',
      message: `"${form.name}" and its stock will be removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteProduct(productId);
      toast({ tone: 'success', title: 'Item deleted' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't delete", message: e.message });
    }
  };

  const pickBranch = async (id) => {
    setBranchId(id);
    setStock([]);
    setStockLoading(true);
    try {
      const res = await getBranchStock(productId, id);
      const rows = listOf(res);
      const list = rows.length ? rows : [toItem(res)];
      setStock(
        list.map((r, i) => {
          const qty = pick(r, ['stock', 'quantity', 'qty']);
          return { id: r.id ?? r.variant_id ?? i, label: pick(r, ['name', 'variant_name', 'title']) || 'Stock', qty, original: qty };
        })
      );
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't load branch stock", message: e.message });
    } finally {
      setStockLoading(false);
    }
  };

  const onStockSave = async () => {
    const changed = stock.filter((r) => r.qty !== r.original);
    if (!changed.length) {
      toast({ tone: 'info', title: 'No changes', message: 'Edit a quantity first.' });
      return;
    }
    setStockSaving(true);
    try {
      for (const r of changed) {
        await updateVariantStock({ product_id: productId, branch_id: branchId, variant_id: r.id, stock: Number(r.qty || 0) });
      }
      setStock((all) => all.map((r) => ({ ...r, original: r.qty })));
      toast({ tone: 'success', title: 'Stock updated' });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't update stock", message: e.message });
    } finally {
      setStockSaving(false);
    }
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="Item details"
          onBack={() => navigation.goBack()}
          right={<SharedBadge tag={`stock-${productId}`} icon="cube" size={44} radius={16} />}
        />
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : loadError ? (
        <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load item" message={loadError} actionLabel="Try again" onAction={fetchProduct} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {!canUpdate ? (
              <View style={styles.readOnlyBanner}>
                <Icon name="lock-closed-outline" size={15} color={colors.textMuted} />
                <Text style={styles.readOnlyText}>View only • Admin access required to edit product</Text>
              </View>
            ) : null}
            <Animated.View entering={enter(0)}>
              <InputField label="Item name" icon="pricetag-outline" value={form.name} error={errors.name} autoCapitalize="words" onChangeText={(v) => canUpdate && set('name', v)} editable={canUpdate} />
              <View style={styles.pair}>
                <InputField style={styles.cell} label="Price (₹)" icon="cash-outline" value={form.price} error={errors.price} keyboardType="numeric" onChangeText={(v) => canUpdate && set('price', v)} editable={canUpdate} />
                <InputField style={styles.cell} label="Low stock at" icon="alert-circle-outline" value={form.lowAt} keyboardType="numeric" onChangeText={(v) => canUpdate && set('lowAt', v)} editable={canUpdate} />
              </View>
              {canUpdate ? (
                <PrimaryButton title="Save changes" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
              ) : null}
            </Animated.View>

            <Animated.View entering={enter(1)} style={styles.section}>
              <Text style={styles.sectionTitle}>Stock by branch</Text>
              <SelectField label="Branch" icon="business-outline" placeholder="Choose a branch" value={branchId} options={branches} onChange={pickBranch} />
              {stockLoading ? <ActivityIndicator color={colors.text} style={{ marginVertical: spacing.md }} /> : null}
              {stock.map((r) => (
                <InputField
                  key={String(r.id)}
                  label={r.label}
                  icon="cube-outline"
                  value={r.qty}
                  keyboardType="numeric"
                  editable={canUpdate}
                  onChangeText={(v) => canUpdate && setStock((all) => all.map((x) => (x.id === r.id ? { ...x, qty: v } : x)))}
                />
              ))}
              {stock.length && canUpdate ? (
                <PrimaryButton title="Update stock" icon="checkmark" variant="light" onPress={onStockSave} loading={stockSaving} />
              ) : null}
            </Animated.View>

            {canDelete ? (
              <Animated.View entering={enter(2)}>
                <PressableScale style={styles.delete} onPress={onDelete} accessibilityLabel="Delete item">
                  <Icon name="trash-outline" size={18} color={colors.danger} />
                  <Text style={styles.deleteText}>Delete item</Text>
                </PressableScale>
              </Animated.View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: spacing.xxl },
  pair: { flexDirection: 'row', gap: spacing.md },
  cell: { flex: 1 },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
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
  deleteText: { color: colors.dangerStrong, fontWeight: '700', fontSize: 15 },
  readOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.chip,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  readOnlyText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
});
