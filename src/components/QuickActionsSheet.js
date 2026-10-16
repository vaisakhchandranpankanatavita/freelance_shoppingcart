import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassBlur from './GlassBlur';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, fonts, radius, shadows, spacing } from '../theme';

// Moved here from DashboardScreen.js: was a dashboard-only horizontal picker, now a single
// global trigger (rendered once, alongside the tab bar) so quick actions reach every tab.
const SHORTCUTS = [
  { key: 'sale', label: 'New bill', detail: 'Start a checkout', icon: 'receipt-outline', tab: 'Sale', screen: 'NewSale', params: { saleId: undefined }, group: 'featured' },
  { key: 'stock', label: 'Add stock', detail: 'Update inventory', icon: 'cube-outline', tab: 'Stock', screen: 'AddStock', group: 'work' },
  { key: 'po', label: 'Purchase order', detail: 'Create an order', icon: 'cart-outline', tab: 'Purchase', screen: 'AddPurchase', params: { purchaseId: undefined }, group: 'work' },
  { key: 'sales', label: 'Sales history', detail: 'View completed bills', icon: 'pricetag-outline', tab: 'Sale', group: 'work' },
  { key: 'branches', label: 'Branches', icon: 'business-outline', tab: 'More', screen: 'EntityList', params: { entity: 'branch' }, group: 'manage' },
  { key: 'categories', label: 'Categories', icon: 'albums-outline', tab: 'More', screen: 'EntityList', params: { entity: 'category' }, group: 'manage' },
  { key: 'suppliers', label: 'Suppliers', icon: 'people-outline', tab: 'More', screen: 'EntityList', params: { entity: 'supplier' }, group: 'manage' },
  { key: 'shop', label: 'Store settings', icon: 'storefront-outline', tab: 'More', screen: 'EntityForm', params: { entity: 'shop' }, group: 'manage' },
];
const FEATURED_ACTION = SHORTCUTS.find((shortcut) => shortcut.group === 'featured');
const WORK_ACTIONS = SHORTCUTS.filter((shortcut) => shortcut.group === 'work');
const MANAGE_ACTIONS = SHORTCUTS.filter((shortcut) => shortcut.group === 'manage');

// Far enough below the screen that any sheet height clears it fully, on any device.
const SHEET_OFF = Dimensions.get('window').height;
const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_VELOCITY = 900;
const OPEN_TIME = { duration: 260, easing: Easing.out(Easing.cubic) };
const CLOSE_TIME = { duration: 200, easing: Easing.in(Easing.cubic) };

// The sheet itself — opened imperatively (via `ref.current.open()`) from the "Quick actions" tab
// bar item, since that item isn't a real route and so has nothing for `navigation.navigate` to
// focus. Replaces the old dashboard-only ActionPicker strip, which only existed on one screen.
const QuickActionsSheet = forwardRef(function QuickActionsSheet({ navigation }, ref) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);
  // Driven both by the open/close animation and by the drag gesture, so the two never fight —
  // dragging just takes over wherever the timing animation currently is.
  const translateY = useSharedValue(SHEET_OFF);

  useEffect(() => {
    if (open) translateY.value = withTiming(0, OPEN_TIME);
  }, [open]);

  const closeNow = () => setOpen(false);
  const close = () => {
    translateY.value = withTiming(SHEET_OFF, CLOSE_TIME, (finished) => {
      if (finished) runOnJS(closeNow)();
    });
  };

  const openAction = (s) => {
    close();
    navigation.navigate(s.tab, s.screen ? { screen: s.screen, params: s.params, initial: false } : undefined);
  };

  // Keep the drag gesture on the handle so vertical scrolling and action taps remain natural.
  const pan = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-10)
    .onChange((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DRAG_CLOSE_DISTANCE || e.velocityY > DRAG_CLOSE_VELOCITY) {
        translateY.value = withTiming(SHEET_OFF, CLOSE_TIME, (finished) => {
          if (finished) runOnJS(closeNow)();
        });
      } else {
        translateY.value = withTiming(0, OPEN_TIME);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  // Fades (and lightly scales) the frosted backdrop with the same drag, so letting go partway
  // through a drag reads as one continuous motion instead of a snap.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, 280], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <>
      {open ? (
        <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={close}>
          {/* Gesture Handler needs its own root inside a native Modal — the app's root view is a
              separate native surface the Modal doesn't share. */}
          <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
              <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.backdropTint} />
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={close}
                accessibilityRole="button"
                accessibilityLabel="Close quick actions"
              />
            </Animated.View>

            <Animated.View style={[styles.sheetPosition, sheetStyle]} pointerEvents="box-none">
              <View
                style={[
                  styles.sheet,
                  { paddingBottom: Math.max(insets.bottom, spacing.lg) },
                ]}
              >
                <View style={styles.glassSurface} pointerEvents="none">
                  <GlassBlur intensity={44} tint="light" style={StyleSheet.absoluteFill} />
                  <View style={styles.glassTint} />
                </View>
                <GestureDetector gesture={pan}>
                  <View style={styles.dragArea}>
                    <View style={styles.handle} />
                  </View>
                </GestureDetector>
                <View style={styles.heading}>
                  <Text style={styles.title}>Quick actions</Text>
                  <PressableScale
                    style={styles.close}
                    onPress={close}
                    accessibilityRole="button"
                    accessibilityLabel="Close quick actions"
                  >
                    <Icon name="close" size={20} color={colors.textMuted} />
                  </PressableScale>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.content}
                  bounces={false}
                >
                  {FEATURED_ACTION ? (
                    <PressableScale
                      style={styles.featured}
                      onPress={() => openAction(FEATURED_ACTION)}
                      accessibilityRole="button"
                      accessibilityLabel={FEATURED_ACTION.label}
                    >
                      <View style={styles.featuredIcon}>
                        <Icon name={FEATURED_ACTION.icon} size={24} color={colors.onAccent} />
                      </View>
                      <View style={styles.featuredCopy}>
                        <Text style={styles.featuredLabel}>{FEATURED_ACTION.label}</Text>
                        <Text style={styles.featuredDetail}>{FEATURED_ACTION.detail}</Text>
                      </View>
                      <View style={styles.featuredArrow}>
                        <Icon name="chevron-forward" size={18} color={colors.accentStrong} />
                      </View>
                    </PressableScale>
                  ) : null}

                  <Text style={styles.sectionTitle}>Daily work</Text>
                  <View style={styles.workGrid}>
                    {WORK_ACTIONS.map((shortcut) => (
                      <PressableScale
                        key={shortcut.key}
                        style={styles.workItem}
                        onPress={() => openAction(shortcut)}
                        accessibilityRole="button"
                        accessibilityLabel={shortcut.label}
                      >
                        <View style={styles.workIcon}>
                          <Icon name={shortcut.icon} size={18} color={colors.accentStrong} />
                        </View>
                        <Text style={styles.actionLabel} numberOfLines={2}>{shortcut.label}</Text>
                      </PressableScale>
                    ))}
                  </View>

                  <Text style={[styles.sectionTitle, styles.manageTitle]}>Manage your store</Text>
                  <View style={styles.manageGrid}>
                    {MANAGE_ACTIONS.map((shortcut) => (
                      <PressableScale
                        key={shortcut.key}
                        style={styles.manageItem}
                        onPress={() => openAction(shortcut)}
                        accessibilityRole="button"
                        accessibilityLabel={shortcut.label}
                      >
                        <View style={styles.manageIcon}>
                          <Icon name={shortcut.icon} size={19} color={colors.accentStrong} />
                        </View>
                        <Text style={styles.manageLabel} numberOfLines={1}>{shortcut.label}</Text>
                        <Icon name="chevron-forward" size={15} color={colors.textFaint} />
                      </PressableScale>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </Animated.View>
          </GestureHandlerRootView>
        </Modal>
      ) : null}
    </>
  );
});

export default QuickActionsSheet;

const styles = StyleSheet.create({
  backdropTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,4,0.22)' },
  sheetPosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: Platform.select({ web: '8%', default: 0 }),
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '84%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Platform.select({
      android: colors.elevated,
      default: 'rgba(255,255,255,0.86)',
    }),
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    backgroundColor: Platform.select({
      android: colors.elevated,
      default: 'rgba(249,247,246,0.9)',
    }),
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.select({
      android: 'transparent',
      default: 'rgba(255,255,255,0.12)',
    }),
  },
  dragArea: { height: 20, alignItems: 'center', justifyContent: 'center' },
  handle: {
    alignSelf: 'center',
    width: 34,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(92,94,88,0.28)',
  },
  heading: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: {
    flex: 1,
    color: colors.ink,
    fontSize: 20,
    fontFamily: fonts.displayBold,
    letterSpacing: -0.4,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  content: { paddingBottom: 0 },
  featured: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accentStrong,
    marginBottom: spacing.md,
  },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  featuredCopy: { flex: 1 },
  featuredLabel: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
  featuredDetail: { color: 'rgba(255,255,255,0.76)', fontSize: 11, marginTop: 2 },
  featuredArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.onAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.35,
    marginBottom: spacing.xs,
  },
  workGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  workItem: {
    width: '48%',
    minHeight: 52,
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  workIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(221,227,211,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '600' },
  manageTitle: { marginTop: spacing.sm },
  manageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  manageItem: {
    width: '48%',
    minHeight: 48,
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  manageIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(221,227,211,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageLabel: { flex: 1, color: colors.text, fontSize: 11, fontWeight: '600' },
});
