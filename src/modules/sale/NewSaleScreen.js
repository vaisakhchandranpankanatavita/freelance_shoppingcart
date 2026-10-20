import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  SlideInDown,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import Screen from '../../components/Screen';
import ScreenHeader, { HEADER_HEIGHT } from '../../components/ScreenHeader';
import SectionCard from '../../components/SectionCard';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import PressableScale from '../../components/PressableScale';
import IconButton from '../../components/IconButton';
import SegmentedControl from '../../components/SegmentedControl';
import GradientBorder from '../../components/GradientBorder';
import { useFeedback } from '../../components/Feedback';
import { colors, spacing, radius, shadows, fonts } from '../../theme';
import { enter, fadeIn, fadeOut, layout, pressSpring } from '../../theme/motion';
import { rupees } from '../../utils/format';
import { editSale, findByBarcode, getCatalog, getSale, searchCatalog, searchCustomer } from './services';

const DELIVERY_TYPES = [
  { key: 'pickup', label: 'Pickup', icon: 'storefront-outline' },
  { key: 'home', label: 'Delivery', icon: 'bicycle-outline' },
  { key: 'express', label: 'Express', icon: 'flash-outline' },
];

export default function NewSaleScreen({ navigation, route }) {
  const saleId = route?.params?.saleId;
  const isEdit = saleId != null;
  const { toast } = useFeedback();
  const scroller = useRef(null);
  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [delivery, setDelivery] = useState('pickup');
  const [mode, setMode] = useState('Cash');
  const [fee, setFee] = useState(0);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [cart, setCart] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch((e) => setCatalogError(e.message || 'Could not load products.'));
  }, []);

  // Edit mode (row 72): prefill from the bill's own detail instead of starting an empty cart.
  useEffect(() => {
    if (!isEdit) return;
    getSale(saleId)
      .then((s) => {
        setCustomer(s.customer === 'Walk-in' ? '' : s.customer);
        setPhone(s.phone || '');
        setDelivery(s.delivery || 'pickup');
        setMode(s.mode || 'Cash');
        setFee(Number(s.fee) || 0);
        setCart(s.cart || []);
      })
      .catch((e) => toast({ tone: 'error', title: "Couldn't load this bill", message: e.message || 'Try again.' }));
  }, [isEdit, saleId]);

  // Server-side name search (row 65) once the customer has typed enough to be worth a request;
  // short queries stay on the already-loaded catalog's client-side filter below.
  useEffect(() => {
    if (search.trim().length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      searchCatalog(search).then((rows) => {
        if (live && rows.length) setCatalog((c) => {
          const known = new Set(c.map((x) => x.id));
          return [...c, ...rows.filter((r) => !known.has(r.id))];
        });
      }).catch(() => {});
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [search]);

  const filtered = useMemo(
    () => catalog.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [catalog, search]
  );

  const onLookupCustomer = async (num) => {
    setLookingUp(true);
    try {
      const found = await searchCustomer(num);
      if (found?.name) {
        setCustomer(found.name);
        toast({ tone: 'success', title: 'Customer found', message: found.name });
      } else {
        toast({ tone: 'info', title: 'New customer', message: 'No previous bills for this number.' });
      }
    } catch (e) {
      // Non-fatal — billing continues with whatever name is typed manually.
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    if (/^\d{10}$/.test(phone)) onLookupCustomer(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const onAddByBarcode = async () => {
    const code = barcode.trim();
    if (!code) return;
    try {
      const matches = await findByBarcode(code);
      if (matches.length) {
        addToCart(matches[0]);
        setBarcode('');
      } else {
        toast({ tone: 'error', title: 'Not found', message: `No product matches barcode ${code}.` });
      }
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't look up barcode", message: e.message || 'Try again.' });
    }
  };

  // The catalog row's `qty` is units on the shelf; the cart line's `qty` is units being sold.
  // Selling more than is on the shelf would drive stock negative, so the cart stops there.
  const stockOf = (id) => catalog.find((c) => c.id === id)?.qty;
  const atLimit = (id, inCart) => {
    const stock = stockOf(id);
    return stock != null && inCart >= stock;
  };
  const warnLimit = (item) => {
    const stock = stockOf(item.id) ?? 0;
    toast({
      tone: 'error',
      title: stock > 0 ? `Only ${stock} in stock` : `${item.name} is out of stock`,
      message: stock > 0 ? `${item.name} can't go above ${stock} on this bill.` : 'Restock it before billing.',
    });
  };

  const addToCart = (item) => {
    const inCart = cart.find((x) => x.id === item.id)?.qty ?? 0;
    if (atLimit(item.id, inCart)) {
      warnLimit(item);
      return;
    }
    setCart((c) => {
      const exists = c.find((x) => x.id === item.id);
      if (exists) return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { ...item, qty: 1 }];
    });
    if (errors.cart) setErrors((e) => ({ ...e, cart: undefined }));
  };

  const changeQty = (id, delta) => {
    const line = cart.find((x) => x.id === id);
    if (delta > 0 && line && atLimit(id, line.qty)) {
      warnLimit(line);
      return;
    }
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
    // Most counter sales are walk-ins: name and phone are optional, but a phone that is
    // entered has to be a full 10-digit number so it can find the customer next time.
    const nextErrors = {};
    if (phone && !/^\d{10}$/.test(phone)) {
      nextErrors.phone = 'Enter all 10 digits, or clear the field';
    }
    if (cart.length === 0) {
      nextErrors.cart = 'Add at least one product to the cart';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({
        tone: 'error',
        title: 'Complete the bill first',
        message: nextErrors.phone || nextErrors.cart,
      });
      if (nextErrors.phone) scroller.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (isEdit) {
      setSaving(true);
      try {
        await editSale(saleId, {
          customer: customer.trim() || 'Walk-in',
          phone,
          delivery,
          mode,
          paymentMethod: mode,
          cart,
          total,
          fee,
          grandTotal: total + fee,
        });
        toast({ tone: 'success', title: 'Bill updated' });
        navigation.goBack();
      } catch (e) {
        toast({ tone: 'error', title: "Couldn't update the bill", message: e.message || 'Try again.' });
      } finally {
        setSaving(false);
      }
      return;
    }

    navigation.navigate('Payment', {
      customer: customer.trim() || 'Walk-in',
      phone,
      delivery,
      mode,
      items,
      total,
      cart,
    });
  };

  return (
    <Screen
      bottomSheet={!isEdit}
      header={
        <ScreenHeader
          title={isEdit ? 'Edit bill' : 'New bill'}
          backIcon={isEdit ? 'arrow-back' : 'close'}
          onBack={() => navigation.goBack()}
        />
      }
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView ref={scroller} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionCard title="Customer & delivery" icon="person-outline" index={0}>
          <View style={styles.row}>
            <InputField
              style={styles.cell}
              icon="person-outline"
              placeholder="Name — leave empty for walk-in"
              value={customer}
              onChangeText={setCustomer}
              autoCapitalize="words"
            />
            <InputField
              style={styles.cell}
              icon="call-outline"
              placeholder="Phone — finds returning customers"
              value={phone}
              error={errors.phone}
              onChangeText={(v) => {
                setPhone(v.replace(/\D/g, '').slice(0, 10));
                if (errors.phone) setErrors((e) => ({ ...e, phone: undefined }));
              }}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <Text style={styles.deliveryLabel}>Delivery type</Text>
          <SegmentedControl options={DELIVERY_TYPES} value={delivery} onChange={setDelivery} />
        </SectionCard>

        <Animated.View entering={enter(1)} style={styles.searchBox}>
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

        <Animated.View entering={enter(2)} style={styles.searchBox}>
          <Icon name="barcode-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Scan or type a barcode, then Enter"
            placeholderTextColor={colors.textFaint}
            value={barcode}
            onChangeText={setBarcode}
            onSubmitEditing={onAddByBarcode}
            returnKeyType="done"
            accessibilityLabel="Add product by barcode"
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
                <IconButton icon="remove" size={28} variant="soft" onPress={() => changeQty(item.id, -1)} accessibilityLabel={`Remove one ${item.name}`} />
                <Text style={styles.qty}>{item.qty}</Text>
                <IconButton icon="add" size={28} variant="soft" onPress={() => changeQty(item.id, 1)} accessibilityLabel={`Add one ${item.name}`} />
                <Text style={styles.lineTotal}>{rupees(item.qty * item.price)}</Text>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <Animated.View layout={layout}>
          <Text style={styles.sectionTitle}>Products</Text>
          {catalogError ? <Text style={styles.catalogError}>{catalogError}</Text> : null}
          {filtered.map((item, i) => (
            <Animated.View key={item.id} entering={enter(i + 3)} layout={layout}>
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
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productPrice}>
                    {rupees(item.price)}
                    {item.qty <= 0 ? (
                      <Text style={styles.outOfStock}>  ·  Out of stock</Text>
                    ) : (
                      <Text>  ·  {item.qty} in stock</Text>
                    )}
                  </Text>
                </View>
                <View style={styles.plusBtn}>
                  <Icon name="add" size={18} color={colors.onAccent} />
                </View>
              </PressableScale>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>

      <Animated.View entering={SlideInDown.springify().damping(20).stiffness(160)} style={[styles.checkoutBar, { bottom: spacing.md }]}>
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
            <Text style={styles.checkoutLabel} numberOfLines={1}>{items} item{items === 1 ? '' : 's'}</Text>
            <Text style={styles.checkoutTotal} numberOfLines={1} adjustsFontSizeToFit>{rupees(total)}</Text>
          </View>
          <PrimaryButton
            title={isEdit ? 'Save changes' : 'Review bill'}
            variant="light"
            onPress={onCheckout}
            loading={isEdit ? saving : undefined}
          />
        </View>
      </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.lg, paddingTop: HEADER_HEIGHT + spacing.sm, paddingBottom: 190 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: 4,
    marginLeft: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  cell: { flex: 1 },
  deliveryLabel: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.textMuted, marginBottom: 4, marginLeft: spacing.xs },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated2,
    height: 44,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  catalogError: { color: colors.dangerStrong, fontSize: 13, marginLeft: spacing.sm, marginBottom: spacing.sm },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.elevated3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.text },
  productPrice: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  outOfStock: { color: colors.dangerStrong, fontFamily: fonts.bodySemiBold },
  plusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  cartName: { flex: 1, color: colors.ink, fontSize: 14, fontFamily: fonts.bodySemiBold },
  qty: { minWidth: 22, textAlign: 'center', fontFamily: fonts.display, color: colors.ink },
  lineTotal: { minWidth: 60, textAlign: 'right', fontFamily: fonts.display, color: colors.ink },
  checkoutBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.lg,
  },
  checkoutRow: { flexDirection: 'row', alignItems: 'center' },
  cartErrorText: {
    color: colors.dangerStrong,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
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
  cartBadgeText: { color: colors.text, fontSize: 10, fontFamily: fonts.display },
  checkoutLabel: { fontSize: 12, color: colors.inkMuted },
  checkoutTotal: { fontSize: 22, fontFamily: fonts.display, letterSpacing: -0.6, color: colors.ink },
});
