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
