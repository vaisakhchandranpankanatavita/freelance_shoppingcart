import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

const TOMATO = '#F2484E';
const MUSTARD = '#F2B33D';
const LEAF = '#1ED58A';
const MILK = '#F4F6F8';
const PLANK = '#3C3C45';
const EDGE = '#4A4A54';
const SHADE = '#1E1E23';
const BEAM = 64;

export const SCENE_W = 400;
export const SCENE_H = 210;

// Where the 400×210 artwork lands in a `width`-wide, 210-tall box: the same
// "xMidYMax slice" crop the <Svg> below uses, exposed so the login loader can
// put each product exactly where it sits on Sign in.
export function shelfFit(width) {
  const s = Math.max(width / SCENE_W, 1);
  return { s, tx: (width - SCENE_W * s) / 2, ty: SCENE_H - SCENE_H * s };
}

function Tag({ x, y, price }) {
  return (
    <G>
      <Rect x={x} y={y} width={30} height={13} rx={2} fill={MILK} />
      <SvgText x={x + 15} y={y + 9.5} fontSize={8} fontWeight="700" fill={SHADE} textAnchor="middle">
        {price}
      </SvgText>
    </G>
  );
}

const Apple = ({ cx, cy, fill }) => (
  <G>
    <Circle cx={cx} cy={cy} r={10.5} fill={fill} />
    <Circle cx={cx - 3.5} cy={cy - 3.5} r={2.5} fill={MILK} opacity={0.35} />
  </G>
);

// `top` is the can stacked on the two below it: a touch shorter, label a touch higher.
const Can = ({ x, y, top }) => (
  <G>
    <Rect x={x} y={y} width={25} height={top ? 38 : 40} rx={3} fill={TOMATO} />
    <Rect x={x} y={y + (top ? 11 : 12)} width={25} height={top ? 12 : 14} fill={MILK} opacity={0.9} />
    <Ellipse cx={x + 12.5} cy={y + 1} rx={12.5} ry={3} fill="#C9373C" />
  </G>
);

const Bottle = ({ x }) => (
  <G>
    <Rect x={x + 5} y={128} width={8} height={8} rx={2} fill={colors.accent} />
    <Rect x={x} y={136} width={18} height={60} rx={6} fill={colors.accent} opacity={0.35} />
    <Rect x={x} y={158} width={18} height={14} fill={colors.accent} opacity={0.9} />
  </G>
);

const Avocado = ({ x }) => (
  <G>
    <Ellipse cx={x} cy={182} rx={12} ry={14} fill="#2F7D4A" />
    <Ellipse cx={x} cy={184} rx={7} ry={8.5} fill="#B8DE6F" />
    <Circle cx={x} cy={187} r={3.5} fill="#8A5A2B" />
  </G>
);

const apple = (cx, cy, fill) => ({
  box: [cx - 11, cy - 11, 22, 22],
  group: 'upper',
  Art: () => <Apple cx={cx} cy={cy} fill={fill} />,
});
const can = (x, y, top) => ({ box: [x - 1, y - 3, 27, 44], group: 'upper', Art: () => <Can x={x} y={y} top={top} /> });

// Every product on the shelves as its own little picture: `box` is its bounds in the
// 400×210 scene. The scene draws them in place; the login loader lifts each one off.
export const SHELF_ITEMS = [
  {
    box: [16, 38, 46, 60],
    group: 'upper',
    Art: () => (
      <G>
        <Rect x={22} y={40} width={34} height={10} rx={3} fill={SHADE} />
        <Rect x={18} y={48} width={42} height={48} rx={9} fill={MUSTARD} />
        <Rect x={18} y={62} width={42} height={16} fill={MILK} opacity={0.92} />
        <Circle cx={39} cy={70} r={4} fill={MUSTARD} />
      </G>
    ),
  },
  {
    box: [72, 14, 40, 84],
    group: 'upper',
    Art: () => (
      <G>
        <Path d="M74 38 L92 22 L110 38 Z" fill="#D9DEE5" />
        <Rect x={74} y={38} width={36} height={58} fill={MILK} />
        <Rect x={74} y={58} width={36} height={10} fill={colors.accent} />
        <Rect x={88} y={16} width={8} height={8} fill="#D9DEE5" />
      </G>
    ),
  },
  can(124, 56),
  can(152, 56),
  can(138, 18, true),
  {
    box: [188, 22, 54, 76],
    group: 'upper',
    Art: () => (
      <G>
        <Rect x={190} y={24} width={50} height={72} rx={3} fill={colors.accent} />
        <Circle cx={215} cy={52} r={13} fill={MUSTARD} />
        <Rect x={198} y={74} width={34} height={6} rx={3} fill={MILK} opacity={0.85} />
        <Rect x={202} y={84} width={26} height={4} rx={2} fill={MILK} opacity={0.6} />
      </G>
    ),
  },
  {
    box: [248, 22, 34, 76],
    group: 'upper',
    Art: () => (
      <G>
        <Rect x={260} y={24} width={10} height={12} rx={2} fill={SHADE} />
        <Path d="M256 36 H274 L280 50 V92 Q280 96 276 96 H254 Q250 96 250 92 V50 Z" fill={LEAF} opacity={0.9} />
        <Rect x={252} y={60} width={26} height={16} fill={MILK} opacity={0.9} />
      </G>
    ),
  },
  apple(300, 86, TOMATO),
  apple(322, 86, LEAF),
  apple(344, 86, TOMATO),
  apple(366, 86, TOMATO),
  apple(311, 66, LEAF),
  apple(333, 66, TOMATO),
  apple(355, 66, LEAF),
  apple(322, 46, TOMATO),
  apple(344, 46, LEAF),
  {
    box: [14, 148, 86, 50],
    group: 'lower',
    Art: () => (
      <G>
        <Path d="M16 196 V168 Q16 150 40 150 H74 Q98 150 98 168 V196 Z" fill="#D89A4E" />
        {[36, 54, 72].map((x) => (
          <Path key={x} d={`M${x} 158 l8 10`} stroke="#B7793A" strokeWidth={3} strokeLinecap="round" />
        ))}
      </G>
    ),
  },
  {
    box: [108, 161, 74, 37],
    group: 'lower',
    Art: () => (
      <G>
        <Rect x={110} y={176} width={70} height={20} rx={3} fill="#C9CFD7" />
        {[122, 139, 156, 173].map((x) => (
          <Ellipse key={x} cx={x - 2} cy={172} rx={7} ry={9} fill={MILK} />
        ))}
      </G>
    ),
  },
  {
    box: [190, 143, 72, 55],
    group: 'lower',
    Art: () => (
      <G>
        <Path d="M196 160 Q210 196 250 186" stroke={MUSTARD} strokeWidth={9} fill="none" strokeLinecap="round" />
        <Path d="M200 150 Q220 186 256 172" stroke="#F6C45E" strokeWidth={9} fill="none" strokeLinecap="round" />
        <Rect x={193} y={146} width={8} height={9} rx={2} fill="#6B5A2A" />
      </G>
    ),
  },
  ...[272, 294, 316].map((x) => ({ box: [x - 1, 127, 20, 70], group: 'lower', Art: () => <Bottle x={x} /> })),
  ...[352, 378].map((x) => ({ box: [x - 13, 167, 26, 31], group: 'lower', Art: () => <Avocado x={x} /> })),
];

// One product on its own, drawn at `scale` × its size in the scene.
export function ShelfItem({ item, scale = 1 }) {
  const [x, y, w, h] = item.box;
  return (
    <Svg width={w * scale} height={h * scale} viewBox={`${x} ${y} ${w} ${h}`}>
      <item.Art />
    </Svg>
  );
}

// The planks, edge lines and price tags — everything on the shelves except the products.
export function ShelfFixtures({ group }) {
  if (group === 'upper') {
    return (
      <>
        <Rect x={0} y={96} width={400} height={9} fill={PLANK} />
        <Rect x={0} y={96} width={400} height={1.5} fill={EDGE} />
        <Tag x={24} y={106} price="₹240" />
        <Tag x={137} y={106} price="₹48" />
        <Tag x={200} y={106} price="₹185" />
        <Tag x={318} y={106} price="₹120" />
      </>
    );
  }
  return (
    <>
      <Rect x={0} y={196} width={400} height={14} fill={PLANK} />
      <Rect x={0} y={196} width={400} height={1.5} fill={EDGE} />
    </>
  );
}

export const Shelf = ({ group }) => (
  <>
    {SHELF_ITEMS.filter((i) => i.group === group).map((item, n) => (
      <item.Art key={n} />
    ))}
    <ShelfFixtures group={group} />
  </>
);

// Two illustrated grocery shelves (viewBox 400×210). Default: swept by a barcode-scanner
// beam. `reveal`: no beam — the shelves glide in from opposite sides, then drift gently;
// `settle` (a 0→1 shared value) calms that drift so the shelves come to rest exactly in place.
// `bare`: just the planks and tags, no products.
export default function ShelfScene({ height = SCENE_H, reveal = false, bare = false, settle }) {
  const [width, setWidth] = useState(0);
  const t = useSharedValue(0);
  const enter = useSharedValue(0);

  useEffect(() => {
    if (reveal) {
      enter.value = withDelay(1300, withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }));
      t.value = withDelay(
        2800,
        withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true)
      );
    } else {
      t.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true);
    }
    return () => {
      cancelAnimation(t);
      cancelAnimation(enter);
    };
  }, [reveal]);

  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -BEAM / 2 + t.value * width }],
  }));
  const upperStyle = useAnimatedStyle(() => {
    const calm = settle ? 1 - settle.value : 1;
    return {
      opacity: enter.value,
      transform: [{ translateX: (1 - enter.value) * -90 }, { translateY: t.value * -3 * calm }],
    };
  });
  const lowerStyle = useAnimatedStyle(() => {
    const calm = settle ? 1 - settle.value : 1;
    return {
      opacity: enter.value,
      transform: [{ translateX: (1 - enter.value) * 90 }, { translateY: t.value * 3 * calm }],
    };
  });

  // Empty shelves (planks and tags only) — the login loader draws the products itself.
  if (bare) {
    return (
      <View style={{ height }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" viewBox="0 0 400 210" preserveAspectRatio="xMidYMax slice">
          <ShelfFixtures group="upper" />
          <ShelfFixtures group="lower" />
        </Svg>
      </View>
    );
  }

  if (reveal) {
    return (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={upperStyle}>
          <Svg width="100%" height={120} viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice">
            <Shelf group="upper" />
          </Svg>
        </Animated.View>
        <Animated.View style={lowerStyle}>
          <Svg width="100%" height={90} viewBox="0 120 400 90" preserveAspectRatio="xMidYMax slice">
            <Shelf group="lower" />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={{ height }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 210" preserveAspectRatio="xMidYMax slice">
        <Shelf group="upper" />
        <Shelf group="lower" />
      </Svg>

      {width ? (
        <Animated.View pointerEvents="none" style={[styles.beam, beamStyle]}>
          <LinearGradient
            colors={['rgba(30,183,235,0)', 'rgba(30,183,235,0.28)', 'rgba(30,183,235,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.core} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  beam: { position: 'absolute', top: 0, bottom: 0, left: 0, width: BEAM, alignItems: 'center' },
  core: { width: 2, height: '100%', backgroundColor: colors.accent, opacity: 0.9 },
});
