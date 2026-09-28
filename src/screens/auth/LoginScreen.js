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
import { colors, spacing } from '../../theme';
import { enter, fadeIn, fadeOut, layout } from '../../theme/motion';
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
            title="Sign In"
            switchLabel="Sign Up"
            switchIcon="person-circle-outline"
            onSwitch={() => navigation.navigate('SignUp')}
          />

          <View style={styles.form}>
            <Animated.View entering={enter(3)}>
              <SegmentedControl
                options={MODES}
                value={loginMode}
                onChange={(m) => {
                  setLoginMode(m);
                  setIdentifier('');
                }}
                style={styles.segment}
              />
            </Animated.View>

            <Animated.View entering={enter(4)} layout={layout}>
              <InputField
                label={loginMode === 'loginId' ? 'Login ID' : 'Username'}
                icon={loginMode === 'loginId' ? 'keypad-outline' : 'person-outline'}
                placeholder={loginMode === 'loginId' ? '4-digit Login ID' : 'Enter your Username'}
                value={identifier}
                onChangeText={(v) =>
                  setIdentifier(loginMode === 'loginId' ? v.replace(/\D/g, '').slice(0, 4) : v)
                }
                keyboardType={loginMode === 'loginId' ? 'number-pad' : 'default'}
                maxLength={loginMode === 'loginId' ? 4 : undefined}
              />
            </Animated.View>
            {loginMode === 'username' && (
              <Animated.View entering={fadeIn()} exiting={fadeOut} layout={layout}>
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

            <Animated.View entering={enter(5)} layout={layout}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRemember((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <Icon name="checkmark" size={14} color={colors.ink} /> : null}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>

              <PrimaryButton title="Sign In" icon="log-in-outline" onPress={onSubmit} loading={loading} />

              <Text style={styles.demoHint}>
                {loginMode === 'loginId'
                  ? 'Demo Login IDs: 1001 (Admin) • 2002 (Staff)'
                  : 'Demo: Admin / admin123 • BillStaff / staff123'}
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  form: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  segment: { marginBottom: spacing.xl },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    marginLeft: spacing.lg,
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
  demoHint: { marginTop: spacing.xl, textAlign: 'center', color: colors.textFaint, fontSize: 12 },
});
