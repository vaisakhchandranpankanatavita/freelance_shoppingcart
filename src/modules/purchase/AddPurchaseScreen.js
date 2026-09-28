import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { addPurchase } from './services';

const FIELDS = [
  { key: 'supplier', label: 'Supplier', icon: 'business-outline', placeholder: 'Supplier name', autoCapitalize: 'words' },
  { key: 'date', label: 'Date', icon: 'calendar-outline', placeholder: 'YYYY-MM-DD' },
  { key: 'items', label: 'Number of items', icon: 'cube-outline', placeholder: '0', keyboardType: 'numeric' },
  { key: 'total', label: 'Total amount', icon: 'cash-outline', placeholder: '₹0', keyboardType: 'numeric' },
];

export default function AddPurchaseScreen({ navigation }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ supplier: '', date: today, items: '', total: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.supplier || !form.items || !form.total) {
      Alert.alert('Missing info', 'Supplier, items and total are required.');
      return;
    }
    setSaving(true);
    try {
      await addPurchase({
        supplier: form.supplier,
        date: form.date,
        items: Number(form.items),
        total: Number(form.total),
      });
      Alert.alert('Success', 'Purchase order created.', [
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
      <ScreenHeader title="New purchase order" onBack={() => navigation.goBack()} />
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
            <PrimaryButton title="Create purchase order" icon="checkmark" onPress={onSave} loading={saving} style={styles.cta} />
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
