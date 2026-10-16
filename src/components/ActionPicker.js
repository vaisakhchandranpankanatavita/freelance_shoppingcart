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
import Icon from './Icon';
import PressableScale from './PressableScale';
import { colors, fonts, radius, shadows } from '../theme';

const ITEM_W = 104;
const ITEM_H = 44;
const IDLE_MS = 110; // scroll has stopped: settle on the nearest option

// One option: a pill-shaped button so it reads as tappable even before it's centred. The
// centred one is bold and lit up on an accent chip; its neighbours shrink and dim, but never
// so far they disappear - they still need to look like buttons, not decoration.
function Option({ label, icon, index, scrollX, active, onPress }) {
  const style = useAnimatedStyle(() => {
    const a = Math.abs(scrollX.value / ITEM_W - index);
    return {
      // Floors raised from 0.5/0.78: at the old values neighbouring actions faded and shrank
      // almost into the background, reading as decoration instead of other tappable buttons.
      opacity: interpolate(a, [0, 1, 2], [1, 0.88, 0.78], 'clamp'),
      transform: [{ scale: interpolate(a, [0, 1, 2], [1, 0.92, 0.86], 'clamp') }],
    };
  });
  const chipStyle = useAnimatedStyle(() => {
    const a = Math.abs(scrollX.value / ITEM_W - index);
    const lit = interpolate(a, [0, 1], [1, 0], 'clamp');
    return {
      // Solid white (`card`, same surface every other button/card uses) instead of the
      // near-white `elevated2` — against this screen's warm-linen background, `elevated2` read
      // as almost no chip at all once the shadow/border were the only other cues.
      backgroundColor: interpolateColor(
        active ? 1 : lit,
        [0, 1],
        [colors.card, colors.accent]
      ),
      borderColor: interpolateColor(active ? 1 : lit, [0, 1], [colors.line, colors.accentStrong]),
    };
  });
  const textStyle = useAnimatedStyle(() => {
    const a = Math.abs(scrollX.value / ITEM_W - index);
    const lit = interpolate(a, [0, 1], [1, 0], 'clamp');
    return { color: interpolateColor(active ? 1 : lit, [0, 1], [colors.text, colors.onAccent]) };
  });
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} style={styles.option} accessibilityLabel={label} accessibilityRole="button">
      <Animated.View style={style}>
        <Animated.View style={[styles.chip, chipStyle]}>
          {icon ? <Icon name={icon} size={15} color={active ? colors.onAccent : colors.text} style={styles.icon} /> : null}
          <Animated.Text style={[styles.optionText, textStyle]} numberOfLines={1}>
            {label}
          </Animated.Text>
        </Animated.View>
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
              label={a.label}
              icon={a.icon}
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
  option: { width: ITEM_W, height: ITEM_H, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    // Every chip now casts the same soft shadow the app's other buttons use (PrimaryButton,
    // AddButton, TabBar), so unfocused options still read as raised, tappable surfaces instead
    // of flattening into the near-white page background once their border is the only cue.
    ...shadows.sm,
  },
  icon: { marginRight: 1 },
  optionText: {
    fontFamily: fonts.display,
    fontSize: 12.5,
    letterSpacing: -0.2,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
