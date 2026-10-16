import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

// expo-blur has no real Gaussian blur on Android before RenderEffect (API 31) and even where it
// is available it composites unreliably here: stacked bands meant to taper a blur/tint wash out
// toward flat white regardless of the `tint` colour, and can ignore an ancestor's
// `overflow: hidden` clip, bleeding square past rounded corners. iOS's blur is the real thing and
// composites exactly where it's drawn, so every "frosted glass" surface in the app renders real
// blur there but renders *nothing* here and leans entirely on its own solid/gradient backdrop —
// one working look per platform instead of one broken-on-Android look everywhere.
// `web` behaves like iOS (CSS backdrop-filter) in practice, so it keeps the blur too.
export default function GlassBlur(props) {
  if (Platform.OS === 'android') return null;
  return <BlurView {...props} />;
}
