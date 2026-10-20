import 'react-native-gesture-handler';
import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { AuthProvider } from './src/context/AuthContext';
import { FeedbackProvider } from './src/components/Feedback';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, fonts } from './src/theme';

// App-wide default: any <Text>/<TextInput> that doesn't set its own `fontFamily` (most inline
// screen styles never did — they rode the OS system font) now renders in Manrope instead.
// Components that explicitly set a `fontFamily` (every headline via `typography.display`/`h2`,
// which carry Manrope) are unaffected — the explicit style wins over this default.
const defaultTextStyle = { fontFamily: fonts.body };
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [defaultTextStyle, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [defaultTextStyle, TextInput.defaultProps.style];

export default function App() {
  const [loaded, fontError] = useFonts({
    [fonts.display]: Manrope_800ExtraBold,
    [fonts.displayBold]: Manrope_700Bold,
    [fonts.displaySemiBold]: Manrope_600SemiBold,
    [fonts.displayMedium]: Manrope_500Medium,
    [fonts.body]: Manrope_400Regular,
    [fonts.bodyMedium]: Manrope_500Medium,
    [fonts.bodySemiBold]: Manrope_600SemiBold,
    [fonts.bodyBold]: Manrope_700Bold,
  });

  return (
    <SafeAreaProvider>
      <View style={styles.outer}>
        <View style={styles.frame}>
          {loaded || fontError ? (
            <AuthProvider>
              <FeedbackProvider>
                <StatusBar style="dark" />
                <RootNavigator />
              </FeedbackProvider>
            </AuthProvider>
          ) : null}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: isWeb ? colors.stage : colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: isWeb ? 430 : '100%',
    backgroundColor: colors.bg,
    ...(isWeb && {
      height: '100%',
      maxHeight: 900,
      borderRadius: 40,
      // 'clip', not 'hidden': an overflow:hidden box is still scrollable by the browser, which
      // scrolled the whole phone frame up whenever a focused input or a sliding-in sheet sat
      // past its edge — leaving headers cut off at the top and a blank band at the bottom.
      overflow: 'clip',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 20 },
    }),
  },
});
