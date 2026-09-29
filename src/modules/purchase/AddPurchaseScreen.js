import React, { useState } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { useFeedback } from '../../components/Feedback';
import { spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { addPurchase } from './services';

const ROWS = [
  [{ key: 'supplier', label: 'Supplier', icon: 'business-outline', placeholder: 'Supplier name', autoCapitalize: 'words' }],
  [{ key: 'date', label: 'Order date', icon: 'calendar-outline', placeholder: 'YYYY-MM-DD' }],
  [
    { key: 'items', label: 'Items', icon: 'cube-outline', placeholder: '0', keyboardType: 'numeric' },
    { key: 'total', label: 'Total (₹)', icon: 'cash-outline', placeholder: '0', keyboardType: 'numeric' },
  ],
];

const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

export default function AddPurchaseScreen({ navigation }) {
  const { toast } = useFeedback();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ supplier: '', date: today, items: '', total: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSave = async () => {
    const next = {};
    if (!form.supplier.trim()) next.supplier = 'Enter the supplier name';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) next.date = 'Use the format YYYY-MM-DD';
    if (!isPositive(form.items)) next.items = 'Enter the item count';
    if (!isPositive(form.total)) next.total = 'Enter the total';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await addPurchase({
        supplier: form.supplier.trim(),
        date: form.date,
        items: Number(form.items),
        total: Number(form.total),
      });
      toast({ tone: 'success', title: 'Purchase order created', message: `${form.supplier.trim()} · ₹${Number(form.total).toLocaleString()}` });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't save the order", message: e.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="New purchase order" onBack={() => navigation.goBack()} />
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
          <PrimaryButton title="Create order" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
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
