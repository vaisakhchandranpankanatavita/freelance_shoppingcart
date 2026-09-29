import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Faint diagonal hatch over the web canvas (the phone app stays plain white);
// sits behind content and ignores touches.
export default function PatternBackground() {
  if (Platform.OS !== 'web') return null;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse">
          <Path d="M-2 2 L2 -2 M0 14 L14 0 M12 16 L16 12" stroke={colors.elevated2} strokeWidth="1.2" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#hatch)" />
    </Svg>
  );
}
