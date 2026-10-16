import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { addStockItem, getStockCategories } from './services';

// Each inner array is one row; two fields share a row. Rows are split into two titled
// sections — what the item is, then how much of it and what it costs — instead of one
// long undifferentiated stack of fields.
const SECTIONS = [
  {
    title: 'Item',
    icon: 'pricetag-outline',
    rows: [
      [{ key: 'name', label: 'Item name', icon: 'pricetag-outline', placeholder: 'e.g. Basmati Rice 5kg', autoCapitalize: 'words' }],
    ],
  },
  {
    title: 'Stock & pricing',
    icon: 'cube-outline',
    rows: [
      [
        { key: 'qty', label: 'Quantity', icon: 'cube-outline', placeholder: '0', keyboardType: 'numeric' },
        { key: 'unit', label: 'Unit', icon: 'options-outline', placeholder: 'pcs, kg' },
      ],
      [
        { key: 'price', label: 'Price per unit (₹)', icon: 'cash-outline', placeholder: '0', keyboardType: 'numeric' },
        { key: 'lowAt', label: 'Low stock at', icon: 'alert-circle-outline', placeholder: '5', keyboardType: 'numeric' },
      ],
    ],
  },
];

const isPositive = (v) => Number.isFinite(Number(v)) && Number(v) > 0;

export default function AddStockScreen({ navigation }) {
  const { toast } = useFeedback();
  const [form, setForm] = useState({ name: '', categoryId: '', qty: '', unit: 'pcs', price: '', lowAt: '' });
  const [categories, setCategories] = useState([]);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStockCategories()
      .then(setCategories)
      .catch((e) => setFormError(e.message || 'Could not load categories.'));
  }, []);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSave = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter the item name';
    if (!form.categoryId) next.categoryId = 'Choose a category';
    if (!isPositive(form.qty)) next.qty = 'Enter a quantity';
    if (!isPositive(form.price)) next.price = 'Enter a price';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await addStockItem({
        name: form.name.trim(),
        categoryId: form.categoryId,
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
    <Screen
      bottomSheet
      sheetHeight="64%"
      header={<ScreenHeader title="Add stock item" backIcon="close" onBack={() => navigation.goBack()} />}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          {SECTIONS.map((section, s) => (
            <SectionCard key={section.title} title={section.title} icon={section.icon} index={s}>
              {section.rows.map((row, r) => (
                <View key={r} style={[styles.row, r > 0 && styles.rowSpacing]}>
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
                </View>
              ))}
              {section.title === 'Item' ? (
                <View style={[styles.row, styles.rowSpacing]}>
                  <SelectField
                    style={styles.cell}
                    label="Category"
                    icon="albums-outline"
                    placeholder="Choose category"
                    value={form.categoryId}
                    options={categories}
                    onChange={(v) => set('categoryId', v)}
                    error={errors.categoryId}
                  />
                </View>
              ) : null}
            </SectionCard>
          ))}
        </ScrollView>
        <Animated.View entering={enter(SECTIONS.length)} style={styles.footer}>
          <PrimaryButton title="Save item" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.sm, paddingBottom: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowSpacing: { marginTop: 2 },
  formError: { color: colors.dangerStrong, fontSize: 13, marginBottom: spacing.sm, marginLeft: spacing.sm },
  cell: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.inkLine,
  },
});
