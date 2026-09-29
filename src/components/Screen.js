import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import PatternBackground from './PatternBackground';
import { colors } from '../theme';
import { timing } from '../theme/motion';

// Nearest navigation object whose own navigator is the tab bar: its 'focus'
// fires on tab switches only, never on stack push/pop (which animate natively).
function findTabScope(navigation) {
  let nav = navigation;
  while (nav && nav.getState?.()?.type !== 'tab') nav = nav.getParent?.();
  return nav;
}

// Black screen shell that fades/lifts its content in on mount and on every tab switch.
export default function Screen({ children, edges = ['top', 'left', 'right'], style }) {
  const navigation = useNavigation();
  const p = useSharedValue(0);

  useEffect(() => {
    const play = () => {
      p.value = 0;
      p.value = withTiming(1, timing);
    };
    play();
    return findTabScope(navigation)?.addListener('focus', play);
  }, [navigation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 14 }],
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
