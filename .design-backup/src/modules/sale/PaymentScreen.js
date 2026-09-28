import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../../theme';

const DELIVERY_LABELS = {
  pickup: 'Store Pickup',
  home: 'Home Delivery',
  express: 'Express',
};

const DELIVERY_ICONS = {
  pickup: 'storefront-outline',
  home: 'bicycle-outline',
  express: 'flash-outline',
};

const DEFAULT_FEE = { pickup: 0, home: 40, express: 80 };

export default function PaymentScreen({ route, navigation }) {
  const {
    total = 0,
    items = 0,
    customer = 'Walk-in',
    phone = '',
    delivery = 'pickup',
    mode = 'Cash',
    cart = [],
  } = route.params || {};

  const [feeStr, setFeeStr] = useState(String(DEFAULT_FEE[delivery] ?? 0));
  const fee = Number(feeStr) || 0;
  const subtotal = Number(total) || 0;
  const grand = useMemo(() => +(subtotal + fee).toFixed(2), [subtotal, fee]);

  const onCheckout = () => {
    navigation.navigate('Checkout', {
      customer,
      phone,
      delivery,
      mode,
      items,
      subtotal,
      fee,
      grand,
      cart,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.cardTitle}>Customer</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{customer}</Text>
          </View>
          {phone ? (
            <View style={styles.rowBetween}>
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{phone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="cart-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.cardTitle}>Items ({items})</Text>
          </View>
          {cart.length === 0 ? (
            <Text style={styles.mutedText}>No items.</Text>
          ) : (
            cart.map((i, idx) => (
              <View
                key={i.id || idx}
                style={[styles.itemRow, idx === cart.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={styles.itemThumb}>
                  <Ionicons name="cube-outline" size={16} color={colors.primaryDark} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.itemName} numberOfLines={1}>{i.name}</Text>
                  <Text style={styles.itemMeta}>Qty {i.qty} × ₹{i.price}</Text>
                </View>
                <Text style={styles.itemTotal}>₹{(i.qty * i.price).toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bicycle-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.cardTitle}>Delivery</Text>
          </View>
          <View style={styles.deliveryPill}>
            <Ionicons name={DELIVERY_ICONS[delivery]} size={16} color={colors.primaryDark} />
            <Text style={styles.deliveryPillText}>{DELIVERY_LABELS[delivery]}</Text>
          </View>

          <Text style={styles.feeLabel}>Delivery Fee</Text>
          <View style={styles.feeRow}>
            <Text style={styles.feePrefix}>₹</Text>
            <TextInput
              style={styles.feeInput}
              value={feeStr}
              onChangeText={(v) => setFeeStr(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Subtotal</Text>
            <Text style={styles.rowValue}>₹{subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Delivery Fee</Text>
            <Text style={styles.rowValue}>₹{fee.toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.grandLabel}>Grand Total</Text>
            <Text style={styles.grandValue}>
              ₹{grand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={onCheckout} activeOpacity={0.85}>
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.checkoutText}>Checkout • ₹{grand.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>
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
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.primaryDark },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: colors.textMuted, fontSize: 13 },
  rowValue: { color: colors.text, fontSize: 13, fontWeight: '600' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemThumb: {
    width: 32, height: 32, borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { fontSize: 13, fontWeight: '600', color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: '700', color: colors.text },
  mutedText: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },

  deliveryPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  deliveryPillText: { color: colors.text, fontWeight: '600', fontSize: 13 },

  feeLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted,
    letterSpacing: 0.5, textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  feeRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    height: 44, backgroundColor: colors.background,
  },
  feePrefix: { fontSize: 15, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  feeInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0, outlineWidth: 0, outlineStyle: 'none' },

  divider: {
    borderTopWidth: 1, borderTopColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: spacing.sm,
  },
  grandLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  grandValue: { color: colors.primaryDark, fontSize: 18, fontWeight: '800' },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDark,
  },
  checkoutText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
