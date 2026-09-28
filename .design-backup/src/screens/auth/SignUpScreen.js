import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { signUp, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(true);

  const onSubmit = async () => {
    if (!username || !loginId || !password) {
      Alert.alert('Missing info', 'Please fill all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (!agree) {
      Alert.alert('Terms', 'Please accept the Terms & Privacy Policy.');
      return;
    }
    try {
      await signUp({ username, loginId, password });
    } catch (e) {
      Alert.alert('Sign up failed', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topDecor} />

          <View style={styles.brandWrap}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brand}>
              gr<Text style={{ color: colors.accent }}>o</Text>cery
            </Text>
          </View>

          <Text style={styles.title}>Create An Account</Text>

          <InputField
            icon="person-outline"
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <InputField
            icon="at-outline"
            placeholder="Login ID"
            value={loginId}
            onChangeText={setLoginId}
          />
          <InputField
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <InputField
            icon="lock-closed-outline"
            placeholder="Confirm Password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setAgree((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agree && styles.checkboxOn]}>
              {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
            <Text style={styles.rememberText}>
              I agree to the <Text style={styles.link}>Terms & Conditions</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <PrimaryButton title="Sign Up" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.md }} />

          <View style={styles.bottomRow}>
            <Text style={styles.footer}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  topDecor: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: colors.surfaceAlt,
  },
  brandWrap: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
  logo: { width: 64, height: 64, marginBottom: spacing.sm },
  brand: { fontSize: 36, fontWeight: '800', color: colors.primaryDark },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primaryDark },
  rememberText: { color: colors.textMuted, fontSize: 12, flex: 1 },
  link: { color: colors.accent, fontWeight: '600' },
  orText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginVertical: spacing.lg,
    fontSize: 13,
  },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footer: { color: colors.textMuted, fontSize: 13 },
  footerLink: { color: colors.accent, fontSize: 13, fontWeight: '700' },
});
