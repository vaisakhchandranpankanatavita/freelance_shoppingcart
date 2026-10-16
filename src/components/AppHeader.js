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
