import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import Icon from './Icon';
import { colors, fonts } from '../theme';

// Square/round badge (icon or initial) used on both ends of a list-row -> detail push. Sharing the
// tag makes Reanimated fly the row's badge into the detail header (and back on pop); building
// both ends from this one component keeps their look identical so the morph never pops.
export default function SharedBadge({ tag, icon, letter, size = 44, radius = size / 3 }) {
  return (
    <Animated.View
      sharedTransitionTag={tag}
      style={[styles.badge, { width: size, height: size, borderRadius: radius }]}
    >
      {icon ? <Icon name={icon} size={Math.round(size * 0.46)} color={colors.ink} /> : null}
      {letter ? <Text style={[styles.letter, { fontSize: Math.round(size * 0.375) }]}>{letter}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.display, color: colors.ink },
});
