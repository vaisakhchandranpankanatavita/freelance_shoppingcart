import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  SlideInDown,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import IconButton from '../../components/IconButton';
import SegmentedControl from '../../components/SegmentedControl';
import GradientBorder from '../../components/GradientBorder';
import { colors, spacing, radius } from '../../theme';
import { enter, fadeIn, fadeOut, layout, pressSpring } from '../../theme/motion';
import { getCatalog } from './services';

const DELIVERY_TYPES = [
  { key: 'pickup', label: 'Pickup', icon: 'storefront-outline' },
  { key: 'home', label: 'Delivery', icon: 'bicycle-outline' },
  { key: 'express', label: 'Express', icon: 'flash-outline' },
];

export default function NewSaleScreen({ navigation }) {
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [delivery, setDelivery] = useState('pickup');
  const [mode] = useState('Cash');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [cart, setCart] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((e) => setCatalogError(e.message || 'Could not load products.'));
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

  // Cart badge "pops" whenever the item count changes.
  const bump = useSharedValue(1);
  useEffect(() => {
    if (items > 0) bump.value = withSequence(withSpring(1.25, pressSpring), withSpring(1, pressSpring));
  }, [items]);
  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

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
    <Screen>
      <ScreenHeader title="New bill" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.Text entering={enter(0)} style={styles.sectionTitle}>Customer</Animated.Text>
        <Animated.View entering={enter(1)}>
          <InputField
            icon="person-outline"
            placeholder="Customer name"
            value={customer}
            error={errors.customer}
            onChangeText={(v) => {
              setCustomer(v);
              if (errors.customer) setErrors((e) => ({ ...e, customer: undefined }));
            }}
            autoCapitalize="words"
          />
        </Animated.View>
        <Animated.View entering={enter(2)}>
          <InputField
            icon="call-outline"
            placeholder="Phone number (10 digits)"
            value={phone}
            error={errors.phone}
            onChangeText={(v) => {
              setPhone(v.replace(/\D/g, '').slice(0, 10));
              if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
            }}
            keyboardType="number-pad"
            maxLength={10}
          />
        </Animated.View>

        <Animated.View entering={enter(3)}>
          <Text style={styles.sectionTitle}>Delivery type</Text>
          <SegmentedControl options={DELIVERY_TYPES} value={delivery} onChange={setDelivery} />
        </Animated.View>

        <Animated.View entering={enter(4)} style={styles.searchBox}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products to add"
            placeholderTextColor={colors.textFaint}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search products"
          />
        </Animated.View>

        {cart.length > 0 && (
          <Animated.View entering={fadeIn()} exiting={fadeOut} layout={layout}>
            <Text style={styles.sectionTitle}>Cart</Text>
            {cart.map((item) => (
              <Animated.View
                key={item.id}
                entering={fadeIn()}
                exiting={fadeOut}
                layout={layout}
                style={styles.cartRow}
              >
                <Text style={styles.cartName} numberOfLines={1}>{item.name}</Text>
                <IconButton icon="remove" size={32} variant="soft" onPress={() => changeQty(item.id, -1)} accessibilityLabel={`Remove one ${item.name}`} />
                <Text style={styles.qty}>{item.qty}</Text>
                <IconButton icon="add" size={32} variant="soft" onPress={() => changeQty(item.id, 1)} accessibilityLabel={`Add one ${item.name}`} />
                <Text style={styles.lineTotal}>₹{item.qty * item.price}</Text>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <Animated.View layout={layout}>
          <Text style={styles.sectionTitle}>Products</Text>
          {catalogError ? <Text style={styles.catalogError}>{catalogError}</Text> : null}
          {filtered.map((item, i) => (
            <Animated.View key={item.id} entering={enter(i + 5)} layout={layout}>
              <PressableScale
                scaleTo={0.97}
                style={styles.productRow}
                onPress={() => addToCart(item)}
                accessibilityLabel={`Add ${item.name} to cart`}
              >
                <View style={styles.thumb}>
                  <Icon name="cube-outline" size={18} color={colors.text} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>₹{item.price}</Text>
                </View>
                <View style={styles.plusBtn}>
                  <Icon name="add" size={18} color={colors.ink} />
                </View>
              </PressableScale>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View entering={SlideInDown.springify().damping(20).stiffness(160)} style={styles.checkoutBar}>
        {errors.cart ? (
          <Animated.Text entering={fadeIn()} style={styles.cartErrorText}>{errors.cart}</Animated.Text>
        ) : null}
        <View style={styles.checkoutRow}>
          <View style={styles.cartBadgeWrap}>
            <Icon name="cart-outline" size={24} color={colors.ink} />
            {items > 0 ? (
              <Animated.View style={[styles.cartBadge, bumpStyle]}>
                <GradientBorder width={1.5} innerStyle={styles.cartBadgeInner}>
                  <Text style={styles.cartBadgeText}>{items > 99 ? '99+' : items}</Text>
                </GradientBorder>
              </Animated.View>
            ) : null}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.checkoutLabel}>{items} item{items === 1 ? '' : 's'}</Text>
            <Text style={styles.checkoutTotal}>₹{total.toLocaleString()}</Text>
          </View>
          <PrimaryButton title="Generate bill" variant="dark" onPress={onCheckout} />
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 200 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  catalogError: { color: colors.danger, fontSize: 13, marginLeft: spacing.sm, marginBottom: spacing.sm },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.elevated3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: 15, fontWeight: '600', color: colors.text },
  productPrice: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  cartName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '600' },
  qty: { minWidth: 22, textAlign: 'center', fontWeight: '800', color: colors.ink },
  lineTotal: { minWidth: 60, textAlign: 'right', fontWeight: '800', color: colors.ink },
  checkoutBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    paddingLeft: spacing.lg,
  },
  checkoutRow: { flexDirection: 'row', alignItems: 'center' },
  cartErrorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  cartBadgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: { position: 'absolute', top: -6, right: -8 },
  cartBadgeInner: { minWidth: 22, height: 22, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: colors.text, fontSize: 10, fontWeight: '800' },
  checkoutLabel: { fontSize: 12, color: colors.inkMuted },
  checkoutTotal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, color: colors.ink },
});
