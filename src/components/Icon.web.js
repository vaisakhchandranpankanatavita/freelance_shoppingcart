import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Lucide from '@animateicons/react/lucide';
import { ICON_MAP, baseName } from './iconMap';

// Web: animated Lucide icons from @animateicons/react (DOM/motion based).
// Plays on mount, on hover (built into the icon), and whenever `animate` changes.
export default function Icon({ name, size = 20, color, style, animate }) {
  const ref = useRef(null);
  const Animated = Lucide[ICON_MAP[baseName(name)]];

  useEffect(() => {
    ref.current?.startAnimation?.();
  }, [animate, name]);

  if (!Animated) return <Ionicons name={name} size={size} color={color} style={style} />;

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated ref={ref} size={size} color={color} aria-hidden />
    </View>
  );
}
