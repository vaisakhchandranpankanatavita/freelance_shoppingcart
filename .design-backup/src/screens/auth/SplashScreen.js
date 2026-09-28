import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Login'), 1800);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topDecor} />
      <View style={styles.center}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>
          gr<Text style={{ color: colors.accent }}>o</Text>cery
        </Text>
        <Text style={styles.tagline}>Supermarket Admin</Text>
      </View>
      <View style={styles.bottomDecor} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 140, height: 140, marginBottom: spacing.md },
  brand: { fontSize: 52, fontWeight: '800', color: colors.primaryDark, letterSpacing: -1 },
  tagline: { marginTop: spacing.sm, color: colors.textMuted, fontSize: 14, letterSpacing: 2 },
  topDecor: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: colors.surfaceAlt,
  },
  bottomDecor: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 300,
    backgroundColor: colors.surfaceAlt,
  },
});
