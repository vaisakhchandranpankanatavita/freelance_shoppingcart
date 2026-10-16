import { makeMutable, useAnimatedScrollHandler } from 'react-native-reanimated';

// 1 while any list is being dragged or is coasting, else 0. The floating TabBar lightens while
// this is 1 so scrolled content shows through it; module-level because the bar and the screens
// live in different parts of the tree.
export const tabBarScrolling = makeMutable(0);

// Vertical list scroll handler: mirrors the offset into `scrollY` (if given) and flags scrolling.
export function useTabBarScrollHandler(scrollY) {
  return useAnimatedScrollHandler({
    onScroll: (e) => {
      if (scrollY) scrollY.value = e.contentOffset.y;
    },
    onBeginDrag: () => {
      tabBarScrolling.value = 1;
    },
    onEndDrag: () => {
      tabBarScrolling.value = 0;
    },
    onMomentumBegin: () => {
      tabBarScrolling.value = 1;
    },
    onMomentumEnd: () => {
      tabBarScrolling.value = 0;
    },
  });
}
