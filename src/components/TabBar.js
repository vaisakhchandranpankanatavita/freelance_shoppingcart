import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, shadows, spacing, fonts } from '../theme';
import { spring } from '../theme/motion';

const IS_ANDROID = Platform.OS === 'android';

const LABELS = { Dashboard: 'Home', Stock: 'Stock', Purchase: 'Purchase', Sale: 'Sales', More: 'More' };
const ACTIONS_LABEL = 'Actions';
// Every label that can ever appear in the dock, keyed the same way `labelWidths` state is —
// route name for tab labels, plus the one non-route "Actions" item.
const ALL_LABELS = { ...LABELS, Actions: ACTIONS_LABEL };

// Screens that present as modals/bottom-sheets or sub-flows with their own primary action button
// at the bottom — the floating tab bar hides smoothly so it never overlaps or crowds their footer.
const HIDE_BAR_SCREENS = new Set([
  'AddStock',
  'AddPurchase',
  'NewSale',
  'EntityForm',
  'PurchaseRequestForm',
  'SupplierPaymentForm',
  'ProductDetail',
  'Checkout',
  'Payment',
  'BillPreview',
  'SaleDetail',
]);

const BAR = 56; // dock height
const RADIUS = BAR / 2; // fully rounded ends: the dock reads as one capsule
const PAD = 6; // gap between the dock edge and the first/last item
const MARGIN_H = spacing.lg;
const BAR_LIFT = spacing.sm; // lifts the floating dock off the screen edge
const ICON = 22;
const LABEL_W = 58; // fallback room until a label's real width is measured (longest label, "Purchase", at 11px bold)
const LABEL_GAP = 6;

// Floor for the Android nav-bar inset: some OEM skins (OnePlus/OxygenOS gesture nav in
// particular) dispatch WindowInsets late or under-report the gesture-pill height, so
// `insets.bottom` can come back as 0 or smaller than the real pill. AOSP's own spec minimum for
// the gesture nav strip is 24dp, so that's the lowest we ever clear to on Android. iOS insets
// are trustworthy, so this only matters on Android.
const MIN_BOTTOM_INSET = IS_ANDROID ? 24 : 10;

// Bottom space a screen must leave so its last control sits clear of the floating dock.
export const useTabBarClearance = () => {
  const { bottom } = useSafeAreaInsets();
  return BAR + Math.max(bottom, MIN_BOTTOM_INSET) + spacing.xs + BAR_LIFT + spacing.md;
};

// One dock item. The active item widens into a light pill holding its icon and label; the rest
// stay icon-only. `f` (0→1) drives width, fill and label together. `extra` is how much *this*
// item's own label adds (its measured text width + gap) so a short label ("Home") doesn't open
// as wide as a long one ("Purchase"); `baseSV` is the shared inactive-item width, springed by the
// parent whenever the currently-open label's width changes, so every item resizes in step and the
// row's total width stays put through the transition.
function TabItem({ focused, icon, label, onPress, onLongPress, a11yLabel, baseSV, extra, highlight = false }) {
  const f = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    f.value = withSpring(focused ? 1 : 0, spring);
  }, [focused]);

  // Background lives on `item` itself (never flattened: it already has real children) instead
  // of a separate empty overlay box, which some Android OEM skins (OnePlus/OxygenOS) drop from
  // the native tree, leaving the label painted straight onto the dark bar with no light pill
  // behind it to read against.
  // `highlight` (used by the "Actions" item, which is never `focused` since it isn't a route)
  // pins the same light chip fill on permanently, instead of leaving it a bare icon with no
  // pill at all because `f` never advances past 0.
  const itemStyle = useAnimatedStyle(() => ({
    width: baseSV.value + extra * f.value,
    backgroundColor: highlight ? colors.chip : interpolateColor(f.value, [0, 1], ['transparent', colors.chip]),
  }));
  const labelStyle = useAnimatedStyle(() => ({
    width: Math.max(extra - LABEL_GAP, 0) * f.value,
    marginLeft: LABEL_GAP * f.value,
    opacity: f.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={a11yLabel}
      android_ripple={null}
    >
      {({ pressed }) => (
        <Animated.View collapsable={false} style={[styles.item, itemStyle, pressed && !focused && styles.pressed]}>
          {/* Inactive glyph used to read `onBar` (near-black) against the dock, but the dock's
              real surface is a dark frosted blur, not the flat mid-grey `onBar` was tuned
              against — near-black on near-black, barely visible. `onAccent` (light) now reads
              clearly there, interpolating to `accentStrong` (deep forest) once the item's pill
              fill goes light enough to need a dark glyph instead — the same light-chip/dark-icon
              pairing QuickActionsSheet's own icons use. `highlight` (the "Actions" item, never
              `focused`) needs that dark tone pinned statically: it sits on the same light chip
              but `f` never advances past 0, so the interpolated colour would stay the light
              (wrong) end. */}
          <Icon
            name={icon}
            size={ICON}
            color={highlight ? colors.accentStrong : undefined}
            progress={highlight ? undefined : f}
            colors={highlight ? undefined : [colors.onAccent, colors.accentStrong]}
            animate={focused}
          />
          <Animated.View collapsable={false} style={[styles.labelClip, labelStyle]}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
      )}
    </Pressable>
  );
}

// Invisible measuring pass: renders every label once with the real label font/weight so we learn
// each one's natural width (via onLayout) before using it to size the dock items. Keeps the
// active pill exactly as wide as its own label needs instead of all sharing one fixed width sized
// for the longest ("Purchase").
function LabelMeasure({ onMeasured }) {
  return (
    <View style={styles.measure} pointerEvents="none">
      {Object.entries(ALL_LABELS).map(([key, text]) => (
        <Text
          key={key}
          style={styles.measureLabel}
          onLayout={(e) => onMeasured(key, Math.ceil(e.nativeEvent.layout.width))}
        >
          {text}
        </Text>
      ))}
    </View>
  );
}

// Floating capsule dock over the scene. The tab you're on expands into a light pill with its
// label; everything else is a quiet icon. "Actions" is not a route, so it sits second-last in the
// row but never takes focus.
export default function TabBar({ state, descriptors, navigation, icons, onQuickActions }) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState({});
  const measuredRef = useRef({});
  const count = state.routes.length + 1; // routes + the Actions item
  const lastRouteIndex = state.routes.length - 1;

  const widthFor = (key) => labelWidths[key] ?? LABEL_W;
  const extraFor = (key) => widthFor(key) + LABEL_GAP;

  const onMeasured = useCallback((key, w) => {
    if (measuredRef.current[key] === w) return;
    measuredRef.current[key] = w;
    setLabelWidths((prev) => ({ ...prev, [key]: w }));
  }, []);

  const currentRoute = state.routes[state.index];
  // Inactive item width such that the one open pill (base + its own label's extra) plus the rest
  // exactly fill the dock — recomputed per currently-focused label so a short label ("Home")
  // leaves every other item a touch wider than a long one ("Purchase") would.
  const activeExtra = extraFor(currentRoute.name);
  const base = width ? (width - PAD * 2 - activeExtra) / count : 0;

  // Springs to whatever `base` resolves to above, so both the dock's first measurement and any
  // later change (switching to a tab with a differently-sized label) animate every item in step
  // instead of snapping.
  const baseSV = useSharedValue(base);
  useEffect(() => {
    baseSV.value = withSpring(base, spring);
  }, [base]);

  const focusedNestedName = currentRoute.state
    ? currentRoute.state.routes[currentRoute.state.index]?.name
    : undefined;
  const shouldHide = Boolean(focusedNestedName && HIDE_BAR_SCREENS.has(focusedNestedName));

  const hideAnim = useSharedValue(shouldHide ? 1 : 0);
  useEffect(() => {
    hideAnim.value = withTiming(shouldHide ? 1 : 0, {
      duration: 220,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [shouldHide]);

  const animatedWrapStyle = useAnimatedStyle(() => ({
    opacity: 1 - hideAnim.value,
    transform: [{ translateY: hideAnim.value * 96 }],
  }));

  const renderRoute = (route, i) => {
    const focused = state.index === i;
    const { options } = descriptors[route.key];
    return (
      <TabItem
        key={route.key}
        baseSV={baseSV}
        extra={extraFor(route.name)}
        focused={focused}
        icon={focused ? icons[route.name][1] : icons[route.name][0]}
        label={LABELS[route.name] ?? route.name}
        a11yLabel={options.tabBarAccessibilityLabel ?? options.title ?? route.name}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        }}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
      />
    );
  };

  return (
    // `box-none` lets taps in the transparent margins fall through to the scrolling screen; only
    // the dock's own items are touch targets. zIndex/elevation: react-native-screens gives each
    // tab's screen its own Android layer, which can otherwise paint over this bar.
    <View style={styles.root} pointerEvents={shouldHide ? 'none' : 'box-none'}>
      <LabelMeasure onMeasured={onMeasured} />
      <Animated.View
        style={[
          styles.wrap,
          { marginBottom: Math.max(insets.bottom, MIN_BOTTOM_INSET) + spacing.xs + BAR_LIFT },
          animatedWrapStyle,
        ]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {width ? (
          <View style={styles.glass}>
            <BlurView intensity={Platform.OS === 'ios' ? 65 : 45} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.row}>
              {state.routes.slice(0, lastRouteIndex).map(renderRoute)}
              <TabItem
                baseSV={baseSV}
                extra={extraFor('Actions')}
                focused={false}
                highlight
                icon="flash-outline"
                label={ACTIONS_LABEL}
                a11yLabel="Quick actions"
                onPress={onQuickActions}
              />
              {renderRoute(state.routes[lastRouteIndex], lastRouteIndex)}
            </View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 50 },
  // Translucent frosted glass dock: real Gaussian blur on iOS and backdrop-filter blur on web,
  // showing content scrolling underneath with a specular shine along the top rim.
  wrap: {
    marginHorizontal: MARGIN_H,
    height: BAR,
    borderRadius: RADIUS,
    backgroundColor: Platform.OS === 'android' ? 'rgba(138, 128, 127, 0.78)' : 'rgba(138, 128, 127, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...shadows.lg,
  },
  glass: { flex: 1, borderRadius: RADIUS, overflow: 'hidden' },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD },
  item: {
    height: BAR - PAD * 2,
    borderRadius: (BAR - PAD * 2) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: { opacity: 0.6 },
  labelClip: { overflow: 'hidden' },
  // No fixed width: the clip above animates to this item's own measured width, so the text just
  // needs to render at its natural size and never wrap inside that window.
  label: { color: colors.accentStrong, fontSize: 12, fontFamily: fonts.bodyBold, letterSpacing: 0.1, flexShrink: 0 },
  measure: { position: 'absolute', opacity: 0 },
  measureLabel: { fontSize: 12, fontFamily: fonts.bodyBold, letterSpacing: 0.1 },
});
