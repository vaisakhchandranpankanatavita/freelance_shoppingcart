import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import PatternBackground from './PatternBackground';
import { colors } from '../theme';

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

const SHIFT = 44;

// Black screen shell. On a tab switch its content slides in from the side the tab lives on (so
// it feels like moving along the bar) and fades up; on first mount it just lifts in.
export default function Screen({ children, edges = ['top', 'left', 'right'], style }) {
  const navigation = useNavigation();
  const p = useSharedValue(0);
  const dir = useSharedValue(0);

  useEffect(() => {
    const tab = findTabScope(navigation);
    const play = () => {
      dir.value = travelDirection(tab);
      p.value = 0;
      p.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) });
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

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <PatternBackground />
      <Animated.View style={[styles.fill, animatedStyle]}>{children}</Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
});
