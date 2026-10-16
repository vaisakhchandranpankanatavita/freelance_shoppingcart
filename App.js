import 'react-native-gesture-handler';
import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts,
} from '@expo-google-fonts/outfit';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AuthProvider } from './src/context/AuthContext';
import { FeedbackProvider } from './src/components/Feedback';
import RootNavigator from './src/navigation/RootNavigator';
import { colors, fonts } from './src/theme';

// App-wide default: any <Text>/<TextInput> that doesn't set its own `fontFamily` (most inline
// screen styles never did — they rode the OS system font) now renders in Inter instead.
// Components that explicitly set a `fontFamily` (every headline via `typography.display`/`h2`,
// which carry Outfit) are unaffected — the explicit style wins over this default.
const defaultTextStyle = { fontFamily: fonts.body };
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [defaultTextStyle, Text.defaultProps.style];
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [defaultTextStyle, TextInput.defaultProps.style];

export default function App() {
  const [loaded, fontError] = useFonts({
    [fonts.display]: Outfit_700Bold,
    [fonts.displaySemiBold]: Outfit_600SemiBold,
    [fonts.displayMedium]: Outfit_500Medium,
    [fonts.body]: Inter_400Regular,
    [fonts.bodyMedium]: Inter_500Medium,
    [fonts.bodySemiBold]: Inter_600SemiBold,
    [fonts.bodyBold]: Inter_700Bold,
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
