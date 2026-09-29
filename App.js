import 'react-native-gesture-handler';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.outer}>
        <View style={styles.frame}>
          <AuthProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </AuthProvider>
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
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 40,
      shadowOffset: { width: 0, height: 20 },
    }),
  },
});
