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
const MOUNT_LEAD_MS = 350; // app mounts this long before the loader lifts, hidden behind it

export default function RootNavigator() {
  const { user } = useAuth();
  // Dummy loader shown for a moment after every sign-in / sign-up. Derived from
  // the id it last finished for, so the app never flashes before the loader.
  const [doneFor, setDoneFor] = useState(null);
  const [mountedFor, setMountedFor] = useState(null);
  const loading = !!user && doneFor !== user.id;
  // The app tree mounts just before the loader lifts: the heavy first render happens behind the
  // opaque loader, while every screen's entrance animation plays as the loader dissolves.
  const showApp = !!user && (!loading || mountedFor === user.id);
  useEffect(() => {
    // Signed out: forget the last user, or signing back in as the same id would skip the loader.
    if (!user) {
      setDoneFor(null);
      setMountedFor(null);
      return undefined;
    }
    const mount = setTimeout(() => setMountedFor(user.id), LOADER_MS - MOUNT_LEAD_MS);
    const done = setTimeout(() => setDoneFor(user.id), LOADER_MS);
    return () => {
      clearTimeout(mount);
      clearTimeout(done);
    };
  }, [user?.id]);
  return (
    <NavigationContainer theme={theme}>
      {/* Keyed so signing in/out cross-fades between the auth and app trees. Sign-in skips
          the fade: the loader opens on the same hero as Sign in, so there is no cut to hide. */}
      <Animated.View key={user ? 'app' : 'auth'} entering={loading ? undefined : fadeIn()} style={styles.fill}>
        {user ? (showApp ? <MainTabNavigator /> : null) : <AuthNavigator />}
        {loading ? <LoginLoader name={user.name} duration={LOADER_MS} /> : null}
      </Animated.View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
