import { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

// One motion language for the whole app: soft, slightly underdamped springs.
// Reanimated honours the OS "reduce motion" setting for all of these by default.
export const spring = { damping: 20, stiffness: 220, mass: 0.9 };
export const pressSpring = { damping: 16, stiffness: 420, mass: 0.6 };

export const timing = { duration: 380, easing: Easing.out(Easing.cubic) };

// Staggered entrance for stacked content; index is capped so long lists don't lag.
export const enter = (index = 0) =>
  FadeInDown.delay(Math.min(index, 8) * 55)
    .springify()
    .damping(18)
    .stiffness(160);

export const fadeIn = (delay = 0) => FadeIn.delay(delay).duration(320);
export const fadeOut = FadeOut.duration(160);

// Smoothly reflows siblings when list items are added, removed or filtered.
export const layout = LinearTransition.springify().damping(20).stiffness(200);
