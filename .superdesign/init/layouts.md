# Layout components

## `src/components/Screen.js`
```js
import React, { createContext, useContext, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import PatternBackground from './PatternBackground';
import { colors, radius, shadows, spacing } from '../theme';

// Which tab section the current screen lives in (set by MainTabNavigator). No longer used to
// pick a background tint (every screen now shares the same plain canvas, no per-section colour
// behind the title) but kept so screens can still read which section they're in.
const SectionContext = createContext(null);
export const SectionProvider = SectionContext.Provider;

// Nearest navigation object whose own navigator is the tab bar: its 'focus'
// fires on tab switches only, never on stack push/pop (which animate natively).
function findTabScope(navigation) {
  let nav = navigation;
  while (nav && nav.getState?.()?.type !== 'tab') nav = nav.getParent?.();
  return nav;
}

// Tab index we came from / are on. Shared by every Screen so each 'focus' listener sees the
// same direction; only advances when the index really changes.
const tabTrack = { prev: 0, cur: 0 };

function travelDirection(tab) {
  const idx = tab?.getState?.().index ?? 0;
  if (idx !== tabTrack.cur) {
    tabTrack.prev = tabTrack.cur;
    tabTrack.cur = idx;
  }
  return Math.sign(tabTrack.cur - tabTrack.prev);
}

const SHIFT = 0;

// Black screen shell. On a tab switch its content slides in from the side the tab lives on (so
// it feels like moving along the bar) and fades up; on first mount it just lifts in.
// `header`, if given, is rendered above that animation and stays put across tab switches —
// only `children` (the scrollable body) replays the slide/fade.
export default function Screen({ header, children, edges = ['top', 'left', 'right'], style, bottomSheet = false, sheetHeight = '92%' }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  useContext(SectionContext);
  const p = useSharedValue(0);
  const dir = useSharedValue(0);

  useEffect(() => {
    const tab = findTabScope(navigation);
    const play = () => {
      dir.value = travelDirection(tab);
      p.value = 0;
      p.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    };
    play();
    return tab?.addListener('focus', play);
  }, [navigation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.6),
    transform: [
      { translateX: dir.value * SHIFT * (1 - p.value) },
      { translateY: dir.value === 0 ? (1 - p.value) * 14 : 0 },
    ],
  }));

  const content = (
    <>
      <PatternBackground />
      <Animated.View style={[styles.fill, animatedStyle]}>{children}</Animated.View>
      {header ? (
        <View style={styles.headerFloat} pointerEvents="box-none">
          {header}
        </View>
      ) : null}
    </>
  );

  if (bottomSheet) {
    return (
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.scrim}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <View style={[styles.sheet, { height: sheetHeight, maxHeight: sheetHeight }]}>
          <View style={styles.sheetHandleWrap} pointerEvents="none">
            <View style={styles.sheetHandle} />
          </View>
          <SafeAreaView
            style={[
              styles.sheetSafe,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}
            edges={['left', 'right']}
          >
            {content}
          </SafeAreaView>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  headerFloat: { position: 'absolute', top: 0, left: 0, right: 0 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 5, 4, 0.45)' },
  sheet: {
    height: '92%',
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: `${colors.line}99`,
    overflow: 'hidden',
    ...shadows.lg,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bg,
  },
  sheetHandle: {
    width: 40,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: colors.inkLine,
  },
  sheetSafe: { flex: 1, backgroundColor: colors.bg },
});
```

## `src/components/AppHeader.js`
```js
import React, { useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  FadeOutUp,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import PressableScale from './PressableScale';
import { HeaderFade, HEADER_HEIGHT_LARGE_NO_BACK } from './ScreenHeader';
import { colors, fonts, radius, shadows, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { AddDisc, HeaderActionContext } from './AddButton';
import { useFeedback } from './Feedback';

const TITLES = {
  Dashboard: 'Store Dashboard',
  Stock: 'Stock',
  Purchase: 'Purchases',
  Sale: 'Sales',
  More: 'More',
};

// The screen each tab's own nested stack opens on. AppHeader only has a meaning here — any other
// screen in that stack (AddStock, NewSale, ProductDetail, EntityForm, ...) renders its own
// ScreenHeader with a back button, which would otherwise float at the exact same spot as this
// persistent title and sit underneath it.
const ROOT_SCREENS = {
  Dashboard: 'DashboardHome',
  Stock: 'StockList',
  Purchase: 'PurchaseList',
  Sale: 'SaleList',
  More: 'MoreHome',
};

const CHAR_STAGGER = 16;

// Each glyph is its own Animated.Text keyed off `${name}-${i}`, so a tab switch unmounts the
// old run of characters and mounts a new one under the same parent — Reanimated plays exiting
// on the outgoing glyphs and entering on the incoming ones instead of a hard cut. Staggering
// the per-glyph delay turns that into a left-to-right reveal, closer to react-native-morphing-text's
// "scale" effect than a single whole-word pop (that native module can't be used directly here —
// it's an old requireNativeComponent view with no New Architecture support, incompatible with
// this Expo SDK 57 / RN 0.86 project).
function MorphingTitle({ name, title }) {
  return (
    <View style={styles.titleRow} accessibilityRole="header" accessibilityLabel={title}>
      {title.split('').map((ch, i) => (
        <Animated.Text
          key={`${name}-${i}`}
          entering={ZoomIn.duration(240).delay(i * CHAR_STAGGER).springify().damping(14).stiffness(200)}
          exiting={ZoomOut.duration(140).delay(i * (CHAR_STAGGER / 2))}
          style={styles.title}
          importantForAccessibility="no"
        >
          {ch === ' ' ? ' ' : ch}
        </Animated.Text>
      ))}
    </View>
  );
}

// Rendered once by MainTabNavigator's `tabBar` slot (same trick TabBar.js uses to stay mounted
// across tab switches) instead of once per screen, so it no longer hard-cuts between tabs.
export default function AppHeader({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { confirm } = useFeedback();
  const [menuOpen, setMenuOpen] = useState(false);
  const { action } = useContext(HeaderActionContext);
  const route = state.routes[state.index];
  const name = route.name;
  const title = TITLES[name] ?? name;
  // `route.state` is the nested stack's own state, present once it has navigated at least once;
  // undefined still means "sitting on the stack's initial (root) screen".
  const focusedNestedName = route.state ? route.state.routes[route.state.index]?.name : undefined;
  const onRootScreen = !focusedNestedName || focusedNestedName === ROOT_SCREENS[name];

  const viewProfile = () => {
    setMenuOpen(false);
    navigation.navigate('More');
  };

  const signOut = async () => {
    setMenuOpen(false);
    const ok = await confirm({
      title: 'Log out?',
      message: 'You will need your Login ID or username to sign back in.',
      confirmLabel: 'Log out',
      destructive: true,
    });
    if (ok) logout();
  };

  return (
    <>
      {/* Hidden (not just invisible) once a screen has been pushed on top of the tab's root list —
          that screen renders its own ScreenHeader with a back button in this exact spot, and
          painting both stacks this title + the profile icon directly over it. `pointerEvents`
          alone wouldn't be enough since the blur/fade and title would still show through. */}
      <View style={[styles.wrap, { top: insets.top }, !onRootScreen && styles.hidden]} pointerEvents={onRootScreen ? 'box-none' : 'none'}>
        <HeaderFade />
        <View style={styles.titleClip}>
          <MorphingTitle name={name} title={title} />
        </View>
        {name === 'Dashboard' ? (
          <PressableScale
            onPress={() => setMenuOpen(true)}
            scaleTo={0.9}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Profile menu"
          >
            <Icon name="person-circle-outline" size={28} color={colors.text} />
          </PressableScale>
        ) : action && onRootScreen ? (
          <AddDisc solid onPress={action.onPress} accessibilityLabel={action.accessibilityLabel} />
        ) : (
          <View style={styles.spacer} />
        )}
      </View>

      {/* A plain absolutely-positioned overlay, not RN's <Modal>: Modal portals to the OS/DOM
          root, which on web escapes the app's own phone-frame clipping and renders the bubbles
          floating outside the app. This sibling view stays inside the same tree as everything
          else (same fix Feedback.js's toast/dialog layer already uses), so it's clipped exactly
          like the rest of the app. The bubbles still pop out from the profile button's corner
          and float there until dismissed. */}
      {menuOpen ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(140)}
          style={styles.overlay}
          pointerEvents="box-none"
        >
          <View style={styles.overlayTint} pointerEvents="none" />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} accessibilityLabel="Close menu" />
          <Animated.View
            entering={FadeInUp.duration(220).springify().damping(18)}
            exiting={FadeOutUp.duration(140)}
            style={[
              styles.menuPanel,
              { top: insets.top + HEADER_HEIGHT_LARGE_NO_BACK - spacing.sm },
            ]}
            accessibilityViewIsModal
          >
            <View style={styles.menuHeading}>
              <View style={styles.menuAvatar}>
                <Icon name="person-circle-outline" size={26} color={colors.accentStrong} />
              </View>
              <View style={styles.menuHeadingCopy}>
                <Text style={styles.menuTitle}>Your account</Text>
                <Text style={styles.menuSubtitle}>Profile and session settings</Text>
              </View>
              <PressableScale
                style={styles.menuClose}
                onPress={() => setMenuOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close menu"
              >
                <Icon name="close" size={20} color={colors.textMuted} />
              </PressableScale>
            </View>

            <View style={styles.menuDivider} />

            <PressableScale
              style={styles.menuAction}
              onPress={viewProfile}
              accessibilityRole="button"
              accessibilityLabel="View profile"
              accessibilityHint="Open your account profile"
            >
              <View style={styles.menuActionIcon}>
                <Icon name="person-outline" size={22} color={colors.accentStrong} />
              </View>
              <View style={styles.menuActionCopy}>
                <Text style={styles.menuActionTitle}>View profile</Text>
                <Text style={styles.menuActionSubtitle}>Personal details and settings</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.textFaint} />
            </PressableScale>

            <PressableScale
              style={[styles.menuAction, styles.menuLogout]}
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Log out"
              accessibilityHint="End your current session"
            >
              <View style={[styles.menuActionIcon, styles.menuLogoutIcon]}>
                <Icon name="log-out-outline" size={22} color={colors.dangerStrong} />
              </View>
              <View style={styles.menuActionCopy}>
                <Text style={[styles.menuActionTitle, styles.menuLogoutTitle]}>Log out</Text>
                <Text style={styles.menuActionSubtitle}>Sign out of this account</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.dangerStrong} />
            </PressableScale>
          </Animated.View>
        </Animated.View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_HEIGHT_LARGE_NO_BACK,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 20,
  },
  hidden: { opacity: 0 },
  titleClip: { flex: 1, overflow: 'hidden' },
  titleRow: { flexDirection: 'row' },
  title: { color: colors.text, fontSize: 22, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: -0.5 },
  spacer: { width: 28 },
  // `elevation`, not just `zIndex`: on Android, elevation (used by TabBar's floating pill for its
  // shadow, shadows.lg -> elevation 12) decides sibling draw order ahead of zIndex, so without an
  // elevation here that's >= TabBar's, these bubbles render underneath the tab bar on Android and
  // are invisible there even though zIndex alone makes them show correctly on iOS/web.
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, elevation: 24 },
  overlayTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,5,4,0.2)' },
  menuPanel: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    maxWidth: 420,
    alignSelf: 'flex-end',
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadows.lg,
  },
  menuHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chip,
  },
  menuHeadingCopy: { flex: 1 },
  menuTitle: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  menuSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  menuClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elevated2,
  },
  menuDivider: { height: 1, backgroundColor: colors.line, marginVertical: spacing.lg },
  menuAction: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.elevated2,
    marginBottom: spacing.sm,
  },
  menuActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.chip,
  },
  menuActionCopy: { flex: 1 },
  menuActionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  menuActionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  menuLogout: {
    marginTop: spacing.xs,
    marginBottom: 0,
    backgroundColor: `${colors.danger}0D`,
    borderWidth: 1,
    borderColor: `${colors.danger}26`,
  },
  menuLogoutIcon: { backgroundColor: `${colors.danger}1A` },
  menuLogoutTitle: { color: colors.dangerStrong },
});
```

## `src/components/TabBar.js`
```js
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
import { colors, shadows, spacing } from '../theme';
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
  label: { color: colors.accentStrong, fontSize: 12, fontWeight: '700', letterSpacing: 0.1, flexShrink: 0 },
  measure: { position: 'absolute', opacity: 0 },
  measureLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.1 },
});
```

## `src/components/PatternBackground.js`
```js
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import GlassBlur from './GlassBlur';
import { colors } from '../theme';

// The app-wide canvas: a near-solid warm-linen wash, drawn top → bottom. When a `tint` is given
// (every in-app screen passes its section's tint, see theme `sectionTints`), a soft aura of three
// blurred orbs glows behind the top of the screen — the same treatment the dashboard introduced,
// so every section shares one look and only the hue tells them apart. The orbs breathe slowly;
// with reduced motion on they hold still. Sits behind content and ignores touches.
const ORBS = [
  { size: 300, top: -100, right: -60, scalePeriod: 5600, rotatePeriod: 16000, opacity: 0.7 },
  { size: 250, top: 50, left: -90, scalePeriod: 6800, rotatePeriod: 22000, opacity: 0.6 },
  { size: 200, top: 160, right: 30, scalePeriod: 4800, rotatePeriod: 13000, opacity: 0.5 },
];

function Orb({ tint, size, top, left, right, scalePeriod, rotatePeriod, opacity, still }) {
  const scale = useSharedValue(0.5);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (still) return;
    scale.value = withRepeat(withTiming(1, { duration: scalePeriod, easing: Easing.inOut(Easing.sin) }), -1, true);
    rotate.value = withRepeat(withTiming(1, { duration: rotatePeriod, easing: Easing.linear }), -1, false);
  }, [still]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.88 + scale.value * 0.25 }, { rotate: `${rotate.value * 360}deg` }],
  }));

  return (
    <Animated.View
      style={[
        styles.orb,
        { top, left, right, width: size, height: size, borderRadius: size / 2, opacity },
        animatedStyle,
      ]}
    >
      <LinearGradient colors={tint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

export default function PatternBackground({ tint }) {
  const still = useReducedMotion();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={colors.bgGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {tint ? (
        <View style={styles.aura}>
          <LinearGradient
            colors={[`${tint[0]}80`, `${tint[0]}33`, `${colors.bg}00`]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          {ORBS.map((orb, i) => (
            <Orb key={i} tint={tint} still={still} {...orb} />
          ))}
          <GlassBlur intensity={45} tint="light" style={StyleSheet.absoluteFill} />
          {/* Fade the aura's lower edge into the canvas so it never ends on a visible line. */}
          <LinearGradient
            colors={[`${colors.bgGradient[0]}00`, colors.bgGradient[0]]}
            locations={[0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 420, overflow: 'hidden' },
  orb: { position: 'absolute', overflow: 'hidden' },
});
```

## `src/navigation/MainTabNavigator.js`
```js
import React, { useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardNavigator from './DashboardNavigator';
import StockNavigator from '../modules/stock/StockNavigator';
import PurchaseNavigator from '../modules/purchase/PurchaseNavigator';
import SaleNavigator from '../modules/sale/SaleNavigator';
import MoreNavigator from './MoreNavigator';
import TabBar from '../components/TabBar';
import QuickActionsSheet from '../components/QuickActionsSheet';
import AppHeader from '../components/AppHeader';
import { HeaderActionProvider } from '../components/AddButton';
import { colors } from '../theme';
import { SectionProvider } from '../components/Screen';

const Tab = createBottomTabNavigator();

// Each tab's stack is wrapped so every Screen inside it knows which section it belongs to and
// paints that section's background tint (theme `sectionTints`). Built once at module level so
// the component identities stay stable across renders.
const inSection = (name, Navigator) => {
  const Section = (props) => (
    <SectionProvider value={name}>
      <Navigator {...props} />
    </SectionProvider>
  );
  Section.displayName = `${name}Section`;
  return Section;
};
const DashboardTab = inSection('Dashboard', DashboardNavigator);
const StockTab = inSection('Stock', StockNavigator);
const PurchaseTab = inSection('Purchase', PurchaseNavigator);
const SaleTab = inSection('Sale', SaleNavigator);
const MoreTab = inSection('More', MoreNavigator);

// [inactive, active] icon per tab
const ICONS = {
  Dashboard: ['speedometer-outline', 'speedometer'],
  Stock: ['cube-outline', 'cube'],
  Purchase: ['cart-outline', 'cart'],
  Sale: ['pricetag-outline', 'pricetag'],
  More: ['ellipsis-horizontal', 'ellipsis-horizontal'],
};

// One persistent header + tab bar pair, rendered by the `tabBar` slot so both stay mounted
// across tab switches instead of remounting with each screen (see AppHeader.js/TabBar.js). The
// "Quick actions" tab bar item isn't a route, so it opens this sheet imperatively via ref.
function TabChrome(props) {
  const sheetRef = useRef(null);
  return (
    <>
      <AppHeader state={props.state} navigation={props.navigation} />
      <TabBar {...props} icons={ICONS} onQuickActions={() => sheetRef.current?.open()} />
      <QuickActionsSheet ref={sheetRef} navigation={props.navigation} />
    </>
  );
}

export default function MainTabNavigator() {
  return (
    <HeaderActionProvider>
    <Tab.Navigator
      screenOptions={{ headerShown: false, freezeOnBlur: true }}
      sceneContainerStyle={{ backgroundColor: colors.bg }}
      tabBar={(props) => <TabChrome {...props} />}
    >
      <Tab.Screen name="Dashboard" component={DashboardTab} />
      <Tab.Screen name="Stock" component={StockTab} />
      <Tab.Screen name="Purchase" component={PurchaseTab} />
      <Tab.Screen name="Sale" component={SaleTab} />
      <Tab.Screen name="More" component={MoreTab} />
    </Tab.Navigator>
    </HeaderActionProvider>
  );
}
```

## `src/navigation/DashboardNavigator.js`
```js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import MetricDetailScreen from '../screens/MetricDetailScreen';
import { stackScreenOptions } from './stackOptions';

const Stack = createNativeStackNavigator();

export default function DashboardNavigator() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      {/* Cross-fade in: the gauge's own zoom/sweep carries the motion. */}
      <Stack.Screen name="MetricDetail" component={MetricDetailScreen} options={{ animation: 'fade' }} />
    </Stack.Navigator>
  );
}
```
