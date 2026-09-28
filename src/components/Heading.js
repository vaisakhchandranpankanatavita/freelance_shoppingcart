import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, typography } from '../theme';

// Headline text with balanced line breaking so short headings never leave a
// single orphan word on the last line at phone widths.
export default function Heading({ level = 'title', tone = 'dark', style, children, ...rest }) {
  return (
    <Animated.Text
      accessibilityRole="header"
      textBreakStrategy="balanced"
      lineBreakStrategyIOS="standard"
      {...rest}
      style={[typography[level], { color: tone === 'dark' ? colors.text : colors.ink }, styles.balance, style]}
    >
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  balance: Platform.select({ web: { textWrap: 'balance' }, default: {} }),
});
