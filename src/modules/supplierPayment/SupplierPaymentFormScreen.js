import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import SelectField from '../../components/SelectField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import SegmentedControl from '../../components/SegmentedControl';
import EmptyState from '../../components/EmptyState';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing, radius } from '../../theme';
import { enter } from '../../theme/motion';
import { getSuppliers } from '../../api';
import { toOptions } from '../manage/entities';
import { BACKEND_READY, addPayment, getPaymentDetail, removePayment } from './services';

const MODES = [
  { key: 'Cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'UPI', label: 'UPI', icon: 'phone-portrait-outline' },
  { key: 'Bank', label: 'Bank', icon: 'business-outline' },
  { key: 'Cheque', label: 'Cheque', icon: 'document-text-outline' },
];

export default function SupplierPaymentFormScreen({ navigation, route }) {
  const paymentId = route?.params?.paymentId;
  const isDetail = paymentId != null;
  const { toast, confirm } = useFeedback();
  const today = new Date().toISOString().slice(0, 10);

  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState('Cash');
  const [reference, setReference] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(isDetail);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!BACKEND_READY) return;
    if (!isDetail) {
      getSuppliers().then((res) => setSuppliers(toOptions(res))).catch(() => setSuppliers([]));
      return;
    }
    setLoading(true);
    getPaymentDetail(paymentId)
      .then((p) => {
        setSupplierId(p.supplier);
        setAmount(String(p.amount));
        setDate(p.date);
        setMode(p.mode);
        setReference(p.reference);
      })
      .catch((e) => setLoadError(e.message || 'Try again.'))
      .finally(() => setLoading(false));
  }, [isDetail, paymentId]);

  const onSave = async () => {
    const next = {};
    if (!supplierId) next.supplier = 'Choose a supplier';
    if (!(Number(amount) > 0)) next.amount = 'Enter an amount';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Use the format YYYY-MM-DD';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await addPayment({ supplierId, amount, date, mode, reference });
      toast({ tone: 'success', title: 'Payment recorded' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't save the payment", message: e.message || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm({ title: 'Delete payment?', message: 'This cannot be undone.', confirmLabel: 'Delete', destructive: true });
    if (!ok) return;
    setDeleting(true);
    try {
      await removePayment(paymentId);
      toast({ tone: 'success', title: 'Payment deleted' });
      navigation.goBack();
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't delete", message: e.message || 'Try again.' });
    } finally {
      setDeleting(false);
    }
  };

  if (!BACKEND_READY) {
    return (
      <Screen header={<ScreenHeader title={isDetail ? 'Payment' : 'New payment'} onBack={() => navigation.goBack()} />}>
        <View style={{ paddingTop: HEADER_HEIGHT + spacing.lg }}>
          <EmptyState
            tone="locked"
            icon="lock-closed-outline"
            title="Supplier payments"
            message="This feature unlocks as soon as the backend ships support for it. The screen is ready and will go live automatically."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bottomSheet={!isDetail} header={<ScreenHeader title={isDetail ? 'Payment' : 'New payment'} onBack={() => navigation.goBack()} />}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
        </View>
      ) : loadError ? (
        <EmptyState tone="error" icon="cloud-offline-outline" title="Can't load payment" message={loadError} actionLabel="Try again" onAction={() => navigation.goBack()} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {isDetail ? (
              <Animated.View entering={enter(0)}>
                <InputField label="Supplier" icon="people-outline" value={supplierId} />
              </Animated.View>
            ) : (
              <Animated.View entering={enter(0)}>
                <SelectField
                  label="Supplier"
                  icon="people-outline"
                  placeholder="Choose supplier"
                  value={supplierId}
                  options={suppliers}
                  onChange={(v) => { setSupplierId(v); if (errors.supplier) setErrors((e) => ({ ...e, supplier: undefined })); }}
                  error={errors.supplier}
                />
              </Animated.View>
            )}

            <Animated.View entering={enter(1)}>
              <InputField
                label="Amount (₹)"
                icon="cash-outline"
                value={amount}
                error={errors.amount}
                keyboardType="numeric"
                onChangeText={(v) => { setAmount(v); if (errors.amount) setErrors((e) => ({ ...e, amount: undefined })); }}
                editable={!isDetail}
              />
            </Animated.View>

            <Animated.View entering={enter(2)}>
              <InputField
                label="Payment date"
                icon="calendar-outline"
                placeholder="YYYY-MM-DD"
                value={date}
                error={errors.date}
                onChangeText={setDate}
                editable={!isDetail}
              />
            </Animated.View>

            <Animated.View entering={enter(3)}>
              <Text style={styles.sectionTitle}>Payment mode</Text>
              <SegmentedControl options={MODES} value={mode} onChange={isDetail ? () => {} : setMode} />
            </Animated.View>

            <Animated.View entering={enter(4)}>
              <InputField
                label="Reference / note"
                icon="document-text-outline"
                placeholder="Optional"
                value={reference}
                onChangeText={setReference}
                editable={!isDetail}
              />
            </Animated.View>

            {isDetail ? (
              <Animated.View entering={enter(5)}>
                <PressableScale style={styles.delete} onPress={onDelete} accessibilityLabel="Delete payment">
                  <Icon name="trash-outline" size={18} color={colors.danger} />
                  <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete payment'}</Text>
                </PressableScale>
              </Animated.View>
            ) : (
              <PrimaryButton title="Record payment" icon="checkmark" variant="light" onPress={onSave} loading={saving} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm, marginLeft: spacing.sm },
  delete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, height: 52, borderRadius: radius.pill, backgroundColor: colors.elevated2 },
  deleteText: { color: colors.dangerStrong, fontWeight: '700', fontSize: 15 },
});
