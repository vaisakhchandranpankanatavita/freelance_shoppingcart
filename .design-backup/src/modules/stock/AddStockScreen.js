import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, spacing } from '../../theme';
import { addStockItem } from './services';

export default function AddStockScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    qty: '',
    unit: 'pcs',
    price: '',
    lowAt: '',
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.name || !form.qty || !form.price) {
      Alert.alert('Missing info', 'Name, quantity and price are required.');
      return;
    }
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
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Stock Item</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <InputField icon="pricetag-outline" placeholder="Item name" value={form.name} onChangeText={(v) => set('name', v)} autoCapitalize="words" />
        <InputField icon="albums-outline" placeholder="Category" value={form.category} onChangeText={(v) => set('category', v)} autoCapitalize="words" />
        <InputField icon="cube-outline" placeholder="Quantity" value={form.qty} onChangeText={(v) => set('qty', v)} keyboardType="numeric" />
        <InputField icon="options-outline" placeholder="Unit (pcs / kg / btl)" value={form.unit} onChangeText={(v) => set('unit', v)} />
        <InputField icon="cash-outline" placeholder="Price per unit" value={form.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" />
        <InputField icon="alert-circle-outline" placeholder="Low stock threshold" value={form.lowAt} onChangeText={(v) => set('lowAt', v)} keyboardType="numeric" />

        <PrimaryButton title="Save Item" onPress={onSave} style={{ marginTop: spacing.md }} />
      </ScrollView>
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
    gap: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
