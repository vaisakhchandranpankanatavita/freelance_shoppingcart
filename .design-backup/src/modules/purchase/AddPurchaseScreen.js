import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, spacing } from '../../theme';
import { addPurchase } from './services';

export default function AddPurchaseScreen({ navigation }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ supplier: '', date: today, items: '', total: '' });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    if (!form.supplier || !form.items || !form.total) {
      Alert.alert('Missing info', 'Supplier, items and total are required.');
      return;
    }
    await addPurchase({
      supplier: form.supplier,
      date: form.date,
      items: Number(form.items),
      total: Number(form.total),
    });
    Alert.alert('Success', 'Purchase order created.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Purchase Order</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <InputField icon="business-outline" placeholder="Supplier name" value={form.supplier} onChangeText={(v) => set('supplier', v)} autoCapitalize="words" />
        <InputField icon="calendar-outline" placeholder="Date (YYYY-MM-DD)" value={form.date} onChangeText={(v) => set('date', v)} />
        <InputField icon="cube-outline" placeholder="Number of items" value={form.items} onChangeText={(v) => set('items', v)} keyboardType="numeric" />
        <InputField icon="cash-outline" placeholder="Total amount (₹)" value={form.total} onChangeText={(v) => set('total', v)} keyboardType="numeric" />
        <PrimaryButton title="Create Purchase Order" onPress={onSave} style={{ marginTop: spacing.md }} />
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
