import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { enableFreeze } from 'react-native-screens';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import LoginLoader from '../components/LoginLoader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { fadeIn } from '../theme/motion';

enableFreeze(true);

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
  const { user, justSignedIn } = useAuth();
  return (
    <NavigationContainer theme={theme}>
      {/* Keyed so signing in/out cross-fades between the auth and app trees. `justSignedIn`
          holds the post-login loader on screen for its minimum show (see AuthContext) even
          when the API answers before the loader's own animation would finish. */}
      <Animated.View key={user ? 'app' : 'auth'} entering={user && justSignedIn ? undefined : fadeIn()} style={styles.fill}>
        {user ? justSignedIn ? <LoginLoader duration={3000} /> : <MainTabNavigator /> : <AuthNavigator />}
      </Animated.View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
