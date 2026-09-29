import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { fadeIn } from '../theme/motion';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.text,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.bg,
  },
};

export default function RootNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer theme={theme}>
      {/* Keyed so signing in/out cross-fades between the auth and app trees. */}
      <Animated.View key={user ? 'app' : 'auth'} entering={fadeIn()} style={styles.fill}>
        {user ? <MainTabNavigator /> : <AuthNavigator />}
      </Animated.View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
