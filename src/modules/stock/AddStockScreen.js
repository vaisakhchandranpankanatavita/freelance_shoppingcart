import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { useFeedback } from '../../components/Feedback';
import { spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { addStockItem } from './services';

// Each inner array is one row; two fields share a row.
const ROWS = [
  [{ key: 'name', label: 'Item name', icon: 'pricetag-outline', placeholder: 'e.g. Basmati Rice 5kg', autoCapitalize: 'words' }],
  [{ key: 'category', label: 'Category', icon: 'albums-outline', placeholder: 'e.g. Grains', autoCapitalize: 'words' }],
  [
    { key: 'qty', label: 'Quantity', icon: 'cube-outline', placeholder: '0', keyboardType: 'numeric' },
    { key: 'unit', label: 'Unit', icon: 'options-outline', placeholder: 'pcs, kg' },
  ],
  [
    { key: 'price', label: 'Price per unit (₹)', icon: 'cash-outline', placeholder: '0', keyboardType: 'numeric' },
    { key: 'lowAt', label: 'Low stock at', icon: 'alert-circle-outline', placeholder: '5', keyboardType: 'numeric' },
  ],
];

const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

export default function AddStockScreen({ navigation }) {
  const { toast } = useFeedback();
  const [form, setForm] = useState({ name: '', category: '', qty: '', unit: 'pcs', price: '', lowAt: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSave = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter the item name';
    if (!isPositive(form.qty)) next.qty = 'Enter a quantity';
    if (!isPositive(form.price)) next.price = 'Enter a price';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await addStockItem({
        name: form.name.trim(),
        category: form.category.trim() || 'General',
        qty: Number(form.qty),
        unit: form.unit.trim() || 'pcs',
        price: Number(form.price),
        lowAt: Number(form.lowAt || 5),
      });
      toast({ tone: 'success', title: 'Item added', message: `${form.name.trim()} is now in stock.` });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't save the item", message: e.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Add stock item" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {ROWS.map((row, r) => (
            <Animated.View key={r} entering={enter(r)} style={styles.row}>
              {row.map((f) => (
                <InputField
                  key={f.key}
                  style={styles.cell}
                  label={f.label}
                  icon={f.icon}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  error={errors[f.key]}
                  onChangeText={(v) => set(f.key, v)}
                  keyboardType={f.keyboardType}
                  autoCapitalize={f.autoCapitalize}
                />
              ))}
            </Animated.View>
          ))}
        </ScrollView>
        <Animated.View entering={enter(ROWS.length)} style={styles.footer}>
          <PrimaryButton title="Save item" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', gap: spacing.md },
  cell: { flex: 1 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, paddingTop: spacing.sm },
});
