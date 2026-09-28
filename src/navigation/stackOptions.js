import { colors } from '../theme';

// Shared native-stack options: black scenes (no white flash mid-transition),
// a consistent slide, and edge-to-edge swipe-back on iOS.
export const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  animationTypeForReplace: 'push',
  fullScreenGestureEnabled: true,
  contentStyle: { backgroundColor: colors.bg },
};
