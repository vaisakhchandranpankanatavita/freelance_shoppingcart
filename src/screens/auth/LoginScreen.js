import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../components/Icon';
import PatternBackground from '../../components/PatternBackground';
import InputField from '../../components/InputField';
import { useFeedback } from '../../components/Feedback';
import SegmentedControl from '../../components/SegmentedControl';
import AuthHero from './AuthHero';
import PinCells from './PinCells';
import Receipt, { Barcode, Perforation, ReceiptHeader, mono } from '../../components/Receipt';
import { colors, spacing } from '../../theme';
import { fadeIn, fadeOut, layout } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';

const MODES = [
  { key: 'loginId', label: 'Login ID' },
  { key: 'username', label: 'Username' },
];

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const { toast } = useFeedback();
  const [loginMode, setLoginMode] = useState('loginId');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  // Signs in as soon as the details are complete: the 4th Login ID digit, or
  // Enter on the password field (a password has no length to detect).
  const submit = async (id, pw) => {
    if (loading) return;
    try {
      await login({
        mode: loginMode,
        identifier: id.trim(),
        password: loginMode === 'loginId' ? undefined : pw,
      });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't sign in", message: e.message });
    }
  };

  const onPinChange = (v) => {
    setIdentifier(v);
    if (/^\d{4}$/.test(v)) submit(v);
  };

  const onPasswordSubmit = () => {
    if (!identifier || !password) {
      toast({ tone: 'error', title: 'Enter your details', message: 'Username and password are both required.' });
      return;
    }
    submit(identifier, password);
  };

  const clear = () => {
    setIdentifier('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
      <PatternBackground />
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
                <PinCells value={identifier} onChangeText={onPinChange} placeholder="4-digit Login ID" />
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
                    returnKeyType="go"
                    onSubmitEditing={onPasswordSubmit}
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

              <Pressable
                style={[styles.clear, !(identifier || password) && styles.clearOff]}
                onPress={clear}
                disabled={loading || !(identifier || password)}
                accessibilityRole="button"
                accessibilityLabel="Clear"
              >
                <Icon name="close-circle-outline" size={18} color={colors.textMuted} />
                <Text style={styles.clearText}>{loading ? 'Signing in…' : 'Clear'}</Text>
              </Pressable>

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
  clear: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  clearOff: { opacity: 0.4 },
  clearText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
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
