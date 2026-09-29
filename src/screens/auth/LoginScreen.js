import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import SegmentedControl from '../../components/SegmentedControl';
import AuthHero from './AuthHero';
import PinCells from './PinCells';
import Receipt, { Barcode, Perforation, ReceiptHeader, mono } from './Receipt';
import { colors, spacing } from '../../theme';
import { fadeIn, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';

const MODES = [
  { key: 'loginId', label: 'Login ID' },
  { key: 'username', label: 'Username' },
];

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const [loginMode, setLoginMode] = useState('loginId');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const onSubmit = async () => {
    if (loginMode === 'loginId') {
      if (!/^\d{4}$/.test(identifier)) {
        Alert.alert('Invalid Login ID', 'Login ID must be exactly 4 digits.');
        return;
      }
    } else if (!identifier || !password) {
      Alert.alert('Missing info', 'Please enter your Username and password.');
      return;
    }
    try {
      await login({
        mode: loginMode,
        identifier: identifier.trim(),
        password: loginMode === 'loginId' ? undefined : password,
      });
    } catch (e) {
      Alert.alert('Login failed', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AuthHero
            title="Sign in"
            subtitle="Open your counter for today's shift."
            switchLabel="Sign up"
            switchIcon="person-circle-outline"
            onSwitch={() => navigation.navigate('SignUp')}
          />

          <Receipt style={styles.receipt}>
            <ReceiptHeader title="Staff sign-in" />
            <Perforation />

            <SegmentedControl
              options={MODES}
              value={loginMode}
              onChange={(m) => {
                setLoginMode(m);
                setIdentifier('');
              }}
              style={styles.segment}
            />

            <Animated.View layout={layout}>
              {loginMode === 'loginId' ? (
                <PinCells value={identifier} onChangeText={setIdentifier} placeholder="4-digit Login ID" />
              ) : (
                <Animated.View entering={fadeIn()} exiting={fadeOut}>
                  <InputField
                    label="Username"
                    icon="person-outline"
                    placeholder="Enter your Username"
                    value={identifier}
                    onChangeText={setIdentifier}
                  />
                  <InputField
                    label="Password"
                    icon="lock-closed-outline"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </Animated.View>
              )}
            </Animated.View>

            <Animated.View layout={layout}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRemember((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <Icon name="checkmark" size={14} color={colors.ink} /> : null}
                </View>
                <Text style={styles.rememberText}>Keep me signed in on this counter</Text>
              </Pressable>

              <PrimaryButton
                title="Sign in"
                icon="log-in-outline"
                variant="light"
                onPress={onSubmit}
                loading={loading}
              />

              <Perforation />
              <Barcode value={identifier} />
              <Text style={styles.demoHint}>
                {loginMode === 'loginId'
                  ? 'Demo IDs: 1001 admin, 2002 staff'
                  : 'Demo: Admin / admin123, BillStaff / staff123'}
              </Text>
            </Animated.View>
          </Receipt>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxl },
  receipt: { marginTop: -48 },
  segment: { marginBottom: spacing.lg },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.card, borderColor: colors.card },
  rememberText: { color: colors.textMuted, fontSize: 14 },
  demoHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: mono,
  },
});
