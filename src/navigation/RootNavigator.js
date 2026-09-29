import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import LoginLoader from '../components/LoginLoader';
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

const LOADER_MS = 3600; // ~1.6s products gather into a ring, then the ring spins

export default function RootNavigator() {
  const { user } = useAuth();
  // Dummy loader shown for a moment after every sign-in / sign-up. Derived from
  // the id it last finished for, so the app never flashes before the loader.
  const [doneFor, setDoneFor] = useState(null);
  const loading = !!user && doneFor !== user.id;
  useEffect(() => {
    if (!user) return undefined;
    const id = setTimeout(() => setDoneFor(user.id), LOADER_MS);
    return () => clearTimeout(id);
  }, [user?.id]);
  return (
    <NavigationContainer theme={theme}>
      {/* Keyed so signing in/out cross-fades between the auth and app trees. Sign-in skips
          the fade: the loader opens on the same hero as Sign in, so there is no cut to hide. */}
      <Animated.View key={user ? 'app' : 'auth'} entering={loading ? undefined : fadeIn()} style={styles.fill}>
        {user ? <MainTabNavigator /> : <AuthNavigator />}
        {loading ? <LoginLoader name={user.name} duration={LOADER_MS} /> : null}
      </Animated.View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
