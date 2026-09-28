import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { addStockItem } from './services';

const FIELDS = [
  { key: 'name', label: 'Item name', icon: 'pricetag-outline', placeholder: 'e.g. Basmati Rice 5kg', autoCapitalize: 'words' },
  { key: 'category', label: 'Category', icon: 'albums-outline', placeholder: 'e.g. Grains', autoCapitalize: 'words' },
  { key: 'qty', label: 'Quantity', icon: 'cube-outline', placeholder: '0', keyboardType: 'numeric' },
  { key: 'unit', label: 'Unit', icon: 'options-outline', placeholder: 'pcs / kg / btl' },
  { key: 'price', label: 'Price per unit', icon: 'cash-outline', placeholder: '₹0', keyboardType: 'numeric' },
  { key: 'lowAt', label: 'Low stock threshold', icon: 'alert-circle-outline', placeholder: '5', keyboardType: 'numeric' },
];

export default function AddStockScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    qty: '',
    unit: 'pcs',
    price: '',
    lowAt: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.name || !form.qty || !form.price) {
      Alert.alert('Missing info', 'Name, quantity and price are required.');
      return;
    }
    setSaving(true);
    try {
      await addStockItem({
        name: form.name,
        category: form.category || 'General',
        qty: Number(form.qty),
        unit: form.unit || 'pcs',
        price: Number(form.price),
        lowAt: Number(form.lowAt || 5),
      });
      Alert.alert('Success', 'Stock item added.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Could not save', e.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Add stock item" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {FIELDS.map((f, i) => (
            <Animated.View key={f.key} entering={enter(i)}>
              <InputField
                label={f.label}
                icon={f.icon}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChangeText={(v) => set(f.key, v)}
                keyboardType={f.keyboardType}
                autoCapitalize={f.autoCapitalize}
              />
            </Animated.View>
          ))}
          <Animated.View entering={enter(FIELDS.length)}>
            <PrimaryButton title="Save item" icon="checkmark" onPress={onSave} loading={saving} style={styles.cta} />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingTop: spacing.md },
  cta: { marginTop: spacing.md },
});
