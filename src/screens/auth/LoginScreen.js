import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import PatternBackground from '../../components/PatternBackground';
import InputField from '../../components/InputField';
import { useFeedback } from '../../components/Feedback';
import SegmentedControl from '../../components/SegmentedControl';
import AuthHero from './AuthHero';
import PinCells from './PinCells';
import Receipt, { Barcode, Perforation, ReceiptHeader, mono } from '../../components/Receipt';
import { colors, spacing, fonts } from '../../theme';
import { fadeIn, fadeOut } from '../../theme/motion';
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
  const [failed, setFailed] = useState(false); // inputs flash red after a bad sign-in
  const shake = useSharedValue(0);
  const failTimer = useRef(null);

  useEffect(() => () => clearTimeout(failTimer.current), []);

  // The hero + receipt are taller than the screen once the keyboard is up, so scroll the
  // receipt (and its Clear button) into view when the keyboard opens.
  const scroller = useRef(null);
  useEffect(() => {
    const evt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const sub = Keyboard.addListener(evt, () => setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50));
    return () => sub.remove();
  }, []);

  // Glitch: a burst of fast, uneven jumps (with a little skew) while the boxes flash red.
  const glitch = () => {
    setFailed(true);
    clearTimeout(failTimer.current);
    failTimer.current = setTimeout(() => setFailed(false), 900);
    const step = (v) => withTiming(v, { duration: 45 });
    shake.value = withSequence(step(-12), step(10), step(-8), step(12), step(-6), step(7), step(-3), step(0));
  };
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { skewX: `${shake.value * 0.6}deg` }],
  }));

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
      glitch();
      setIdentifier('');
      setPassword('');
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scroller}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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

            <Animated.View style={[styles.fullWidth, shakeStyle]}>
              {loginMode === 'loginId' ? (
                <PinCells value={identifier} onChangeText={onPinChange} placeholder="4-digit Login ID" error={failed} />
              ) : (
                <Animated.View entering={fadeIn()} exiting={fadeOut}>
                  <InputField
                    label="Username"
                    icon="person-outline"
                    placeholder="Enter your Username"
                    value={identifier}
                    onChangeText={setIdentifier}
                    flash={failed}
                    center
                  />
                  <InputField
                    label="Password"
                    icon="lock-closed-outline"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    flash={failed}
                    center
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={onPasswordSubmit}
                  />
                </Animated.View>
              )}
            </Animated.View>

            <View>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRemember((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: remember }}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <Icon name="checkmark" size={14} color={colors.onAccent} /> : null}
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
                <Text style={styles.clearText}>{loading ? 'Signing in�' : 'Clear'}</Text>
              </Pressable>

              <Perforation />
              <Barcode value={identifier} />
              <Text style={styles.demoHint}>
                {loginMode === 'loginId'
                  ? 'Demo IDs: 1001 admin, 2002 staff'
                  : 'Demo: Admin / admin123, BillStaff / staff123'}
              </Text>
            </View>
          </Receipt>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.lg },
  receipt: { marginTop: -48 },
  fullWidth: { width: '100%' },
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
  clearText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.bodySemiBold },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  rememberText: { color: colors.textMuted, fontSize: 14 },
  demoHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: mono,
  },
});
