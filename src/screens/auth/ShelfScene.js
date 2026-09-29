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

function Upper() {
  return (
    <>
        {/* Upper shelf */}
        {/* Honey jar */}
        <Rect x={22} y={40} width={34} height={10} rx={3} fill={SHADE} />
        <Rect x={18} y={48} width={42} height={48} rx={9} fill={MUSTARD} />
        <Rect x={18} y={62} width={42} height={16} fill={MILK} opacity={0.92} />
        <Circle cx={39} cy={70} r={4} fill={MUSTARD} />
        {/* Milk carton */}
        <Path d="M74 38 L92 22 L110 38 Z" fill="#D9DEE5" />
        <Rect x={74} y={38} width={36} height={58} fill={MILK} />
        <Rect x={74} y={58} width={36} height={10} fill={colors.accent} />
        <Rect x={88} y={16} width={8} height={8} fill="#D9DEE5" />
        {/* Tomato cans */}
        {[124, 152].map((x) => (
          <G key={x}>
            <Rect x={x} y={56} width={25} height={40} rx={3} fill={TOMATO} />
            <Rect x={x} y={68} width={25} height={14} fill={MILK} opacity={0.9} />
            <Ellipse cx={x + 12.5} cy={57} rx={12.5} ry={3} fill="#C9373C" />
          </G>
        ))}
        <Rect x={138} y={18} width={25} height={38} rx={3} fill={TOMATO} />
        <Rect x={138} y={29} width={25} height={12} fill={MILK} opacity={0.9} />
        <Ellipse cx={150.5} cy={19} rx={12.5} ry={3} fill="#C9373C" />
        {/* Cereal box */}
        <Rect x={190} y={24} width={50} height={72} rx={3} fill={colors.accent} />
        <Circle cx={215} cy={52} r={13} fill={MUSTARD} />
        <Rect x={198} y={74} width={34} height={6} rx={3} fill={MILK} opacity={0.85} />
        <Rect x={202} y={84} width={26} height={4} rx={2} fill={MILK} opacity={0.6} />
        {/* Oil bottle */}
        <Rect x={260} y={24} width={10} height={12} rx={2} fill={SHADE} />
        <Path d="M256 36 H274 L280 50 V92 Q280 96 276 96 H254 Q250 96 250 92 V50 Z" fill={LEAF} opacity={0.9} />
        <Rect x={252} y={60} width={26} height={16} fill={MILK} opacity={0.9} />
        {/* Apple pyramid */}
        {[
          [300, 86, TOMATO],
          [322, 86, LEAF],
          [344, 86, TOMATO],
          [366, 86, TOMATO],
          [311, 66, LEAF],
          [333, 66, TOMATO],
          [355, 66, LEAF],
          [322, 46, TOMATO],
          [344, 46, LEAF],
        ].map(([cx, cy, fill]) => (
          <G key={`${cx}-${cy}`}>
            <Circle cx={cx} cy={cy} r={10.5} fill={fill} />
            <Circle cx={cx - 3.5} cy={cy - 3.5} r={2.5} fill={MILK} opacity={0.35} />
          </G>
        ))}
        <Rect x={0} y={96} width={400} height={9} fill={PLANK} />
        <Rect x={0} y={96} width={400} height={1.5} fill={EDGE} />
        <Tag x={24} y={106} price="₹240" />
        <Tag x={137} y={106} price="₹48" />
        <Tag x={200} y={106} price="₹185" />
        <Tag x={318} y={106} price="₹120" />
    </>
  );
}

function Lower() {
  return (
    <>
        {/* Lower shelf */}
        {/* Bread loaf */}
        <Path d="M16 196 V168 Q16 150 40 150 H74 Q98 150 98 168 V196 Z" fill="#D89A4E" />
        {[36, 54, 72].map((x) => (
          <Path key={x} d={`M${x} 158 l8 10`} stroke="#B7793A" strokeWidth={3} strokeLinecap="round" />
        ))}
        {/* Egg tray */}
        <Rect x={110} y={176} width={70} height={20} rx={3} fill="#C9CFD7" />
        {[122, 139, 156, 173].map((x) => (
          <Ellipse key={x} cx={x - 2} cy={172} rx={7} ry={9} fill={MILK} />
        ))}
        {/* Bananas */}
        <Path d="M196 160 Q210 196 250 186" stroke={MUSTARD} strokeWidth={9} fill="none" strokeLinecap="round" />
        <Path d="M200 150 Q220 186 256 172" stroke="#F6C45E" strokeWidth={9} fill="none" strokeLinecap="round" />
        <Rect x={193} y={146} width={8} height={9} rx={2} fill="#6B5A2A" />
        {/* Water bottles */}
        {[272, 294, 316].map((x) => (
          <G key={x}>
            <Rect x={x + 5} y={128} width={8} height={8} rx={2} fill={colors.accent} />
            <Rect x={x} y={136} width={18} height={60} rx={6} fill={colors.accent} opacity={0.35} />
            <Rect x={x} y={158} width={18} height={14} fill={colors.accent} opacity={0.9} />
          </G>
        ))}
        {/* Avocados */}
        {[352, 378].map((x) => (
          <G key={x}>
            <Ellipse cx={x} cy={182} rx={12} ry={14} fill="#2F7D4A" />
            <Ellipse cx={x} cy={184} rx={7} ry={8.5} fill="#B8DE6F" />
            <Circle cx={x} cy={187} r={3.5} fill="#8A5A2B" />
          </G>
        ))}
        <Rect x={0} y={196} width={400} height={14} fill={PLANK} />
        <Rect x={0} y={196} width={400} height={1.5} fill={EDGE} />
    </>
  );
}

// Two illustrated grocery shelves (viewBox 400×210). Default: swept by a barcode-scanner
// beam. `reveal`: no beam — the shelves glide in from opposite sides, then drift gently.
export default function ShelfScene({ height = 210, reveal = false }) {
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
  const upperStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateX: (1 - enter.value) * -90 }, { translateY: t.value * -3 }],
  }));
  const lowerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateX: (1 - enter.value) * 90 }, { translateY: t.value * 3 }],
  }));

  if (reveal) {
    return (
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={upperStyle}>
          <Svg width="100%" height={120} viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice">
            <Upper />
          </Svg>
        </Animated.View>
        <Animated.View style={lowerStyle}>
          <Svg width="100%" height={90} viewBox="0 120 400 90" preserveAspectRatio="xMidYMax slice">
            <Lower />
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
        <Upper />
        <Lower />
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
