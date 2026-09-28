import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../theme';
import { addSale, getCatalog } from './services';

const DELIVERY_TYPES = [
  { key: 'pickup', label: 'Store Pickup', icon: 'storefront-outline' },
  { key: 'home', label: 'Home Delivery', icon: 'bicycle-outline' },
  { key: 'express', label: 'Express', icon: 'flash-outline' },
];

export default function NewSaleScreen({ navigation }) {
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [delivery, setDelivery] = useState('pickup');
  const [mode, setMode] = useState('Cash');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCatalog().then(setCatalog);
  }, []);

  const filtered = useMemo(
    () => catalog.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [catalog, search]
  );

  const addToCart = (item) => {
    setCart((c) => {
      const exists = c.find((x) => x.id === item.id);
      if (exists) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });
    if (errors.cart) setErrors((e) => ({ ...e, cart: undefined }));
  };

  const changeQty = (id, delta) => {
    setCart((c) =>
      c
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );
  };

  const total = cart.reduce((s, i) => s + i.qty * i.price, 0);
  const items = cart.reduce((s, i) => s + i.qty, 0);

  const onCheckout = async () => {
    const nextErrors = {};
    if (!customer.trim()) {
      nextErrors.customer = 'Customer name is required';
    }
    if (!phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phone)) {
      nextErrors.phone = 'Phone number must be 10 digits';
    }
    if (cart.length === 0) {
      nextErrors.cart = 'Please add atleast one product to cart';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    navigation.navigate('Payment', {
      customer: customer.trim(),
      phone,
      delivery,
      mode,
      items,
      total,
      cart,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Bill</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 240 }}>
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Customer Details</Text>
          <InputField
            icon="person-outline"
            placeholder="Enter customer name"
            value={customer}
            onChangeText={(v) => {
              setCustomer(v);
              if (errors.customer) setErrors((e) => ({ ...e, customer: undefined }));
            }}
            autoCapitalize="words"
          />
          {errors.customer ? <Text style={styles.errorText}>{errors.customer}</Text> : null}
          <InputField
            icon="call-outline"
            placeholder="Phone number (10 digits)"
            value={phone}
            onChangeText={(v) => {
              setPhone(v.replace(/\D/g, '').slice(0, 10));
              if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
            }}
            keyboardType="number-pad"
            maxLength={10}
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

          <Text style={styles.detailsLabel}>Delivery Type</Text>
          <View style={styles.deliveryRow}>
            {DELIVERY_TYPES.map((d) => {
              const active = delivery === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.deliveryChip, active && styles.deliveryChipActive]}
                  onPress={() => setDelivery(d.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={d.icon}
                    size={16}
                    color={active ? '#fff' : colors.primaryDark}
                  />
                  <Text style={[styles.deliveryText, active && { color: '#fff' }]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products to add"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Text style={styles.sectionTitle}>Products</Text>
        <View>
          {filtered.map((item) => (
            <TouchableOpacity key={item.id} style={styles.productRow} onPress={() => addToCart(item)}>
              <View style={styles.thumb}>
                <Ionicons name="cube-outline" size={18} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>₹{item.price}</Text>
              </View>
              <View style={styles.plusBtn}>
                <Ionicons name="add" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {cart.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Cart</Text>
            {cart.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <Text style={{ flex: 1, color: colors.text }}>{item.name}</Text>
                <TouchableOpacity onPress={() => changeQty(item.id, -1)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={16} color={colors.primaryDark} />
                </TouchableOpacity>
                <Text style={styles.qty}>{item.qty}</Text>
                <TouchableOpacity onPress={() => changeQty(item.id, 1)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={16} color={colors.primaryDark} />
                </TouchableOpacity>
                <Text style={styles.lineTotal}>₹{item.qty * item.price}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={styles.checkoutBar}>
        {errors.cart ? (
          <Text style={styles.cartErrorText}>{errors.cart}</Text>
        ) : null}
        <View style={styles.checkoutRow}>
          <View style={styles.cartBadgeWrap}>
            <Ionicons name="cart-outline" size={26} color={colors.primaryDark} />
            {items > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{items > 99 ? '99+' : items}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.checkoutLabel}>{items} item{items === 1 ? '' : 's'} • {mode}</Text>
            <Text style={styles.checkoutTotal}>₹{total.toLocaleString()}</Text>
          </View>
          <PrimaryButton title="Generate Bill" onPress={onCheckout} style={{ paddingHorizontal: 24 }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md,
    backgroundColor: colors.surface, gap: spacing.sm,
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  iconBtn: {
    width: 40, height: 40, borderRadius: 999, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deliveryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  deliveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deliveryChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  deliveryText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  modeChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  modeChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  modeText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    height: 44, borderRadius: radius.pill, paddingHorizontal: spacing.md,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.text, paddingVertical: 0 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  thumb: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  plusBtn: {
    width: 32, height: 32, borderRadius: 999, backgroundColor: colors.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  cartRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, padding: spacing.md,
    borderRadius: radius.md, marginBottom: spacing.xs,
  },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 999, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  qty: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: colors.text },
  lineTotal: { minWidth: 60, textAlign: 'right', fontWeight: '700', color: colors.text },
  checkoutBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  checkoutRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cartErrorText: {
    color: colors.danger, fontSize: 12, fontWeight: '600',
    marginBottom: spacing.sm, textAlign: 'center',
  },
  errorText: {
    color: colors.danger, fontSize: 12,
    marginTop: -spacing.sm, marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  cartBadgeWrap: {
    width: 44, height: 44, borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 999,
    backgroundColor: colors.danger,
    paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.surface,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  checkoutLabel: { fontSize: 11, color: colors.textMuted },
  checkoutTotal: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
});
