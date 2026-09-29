import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import PressableScale from './PressableScale';
import { colors, fonts } from '../theme';

const ITEM_W = 132;
const ITEM_H = 52;
const IDLE_MS = 110; // scroll has stopped: settle on the nearest option

// One option: the centred one is big and bold, its neighbours shrink and fade away.
function Option({ label, index, scrollX, active, onPress }) {
  const style = useAnimatedStyle(() => {
    const a = Math.abs(scrollX.value / ITEM_W - index);
    return {
      opacity: interpolate(a, [0, 1, 2], [1, 0.5, 0.18], 'clamp'),
      transform: [{ scale: interpolate(a, [0, 1, 2], [1, 0.74, 0.6], 'clamp') }],
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const a = Math.abs(scrollX.value / ITEM_W - index);
    return { color: interpolateColor(a, [0, 1], [active ? colors.accentStrong : colors.text, colors.textFaint]) };
  });
  return (
    <PressableScale onPress={onPress} scaleTo={0.96} style={styles.option} accessibilityLabel={label}>
      <Animated.View style={style}>
        <Animated.Text style={[styles.optionText, textStyle]} numberOfLines={1}>
          {label}
        </Animated.Text>
        {active ? <View style={styles.underline} /> : null}
      </Animated.View>
    </PressableScale>
  );
}

// Horizontal snapping picker: scroll (or drag, or tap) an option to the centre to arm it,
// then tap the armed option to open it.
export default function ActionPicker({ actions, onOpen }) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(null); // armed option; a tap on it opens it
  const centre = useRef(0); // option currently sitting in the middle
  const scrollX = useSharedValue(0);
  const ref = useRef(null);
  const idle = useRef(null);
  const pad = Math.max(0, (width - ITEM_W) / 2);

  const goTo = (i) => ref.current?.scrollTo({ x: i * ITEM_W, animated: true });

  const settle = (x) => {
    const i = Math.min(actions.length - 1, Math.max(0, Math.round(x / ITEM_W)));
    // Scrolling an option into the middle arms it; the option resting there at the start is not armed.
    if (i !== centre.current) setActive(i);
    centre.current = i;
    if (Math.abs(x - i * ITEM_W) > 1) goTo(i);
  };

  // Every scroll source (touch, wheel, mouse drag, programmatic) ends in silence; settle then.
  const settleSoon = (x) => {
    clearTimeout(idle.current);
    idle.current = setTimeout(() => settle(x), IDLE_MS);
  };
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
    runOnJS(settleSoon)(e.contentOffset.x);
  });
  useEffect(() => () => clearTimeout(idle.current), []);

  // Web has no touch: let the mouse drag the strip.
  useEffect(() => {
    if (Platform.OS !== 'web' || !width) return undefined;
    const el = ref.current?.getScrollableNode?.() ?? ref.current;
    if (!el?.addEventListener) return undefined;
    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    const move = (e) => {
      if (dragging) el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const up = () => {
      dragging = false;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    const down = (e) => {
      dragging = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    };
    el.addEventListener('mousedown', down);
    return () => {
      el.removeEventListener('mousedown', down);
      up();
    };
  }, [width]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width ? (
        <Animated.ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_W}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ paddingHorizontal: pad }}
          style={styles.strip}
        >
          {actions.map((a, i) => (
            <Option
              key={a.key}
              label={a.label.toUpperCase()}
              index={i}
              scrollX={scrollX}
              active={i === active}
              onPress={() => {
                if (i === active) return onOpen(a);
                setActive(i); // first tap: bring to the middle and arm it
                return goTo(i);
              }}
            />
          ))}
        </Animated.ScrollView>
      ) : (
        <View style={styles.strip} />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  strip: { height: ITEM_H, flexGrow: 0 },
  option: { width: ITEM_W, height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  underline: { alignSelf: 'center', width: 22, height: 3, borderRadius: 2, marginTop: 2, backgroundColor: colors.accent },
  optionText: {
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: -0.3,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
