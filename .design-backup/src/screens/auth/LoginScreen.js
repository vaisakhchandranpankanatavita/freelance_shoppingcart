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

export default function LoginScreen() {
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
          <View style={styles.hero}>
            <View style={styles.heroBubble}>
              <Text style={styles.heroBubbleText}>Grocery{'\n'}Store</Text>
            </View>
            <Image
              source={require('../../../assets/hero.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <View style={styles.segment}>
              <TouchableOpacity
                style={[styles.segmentTab, loginMode === 'loginId' && styles.segmentTabActive]}
                activeOpacity={0.8}
                onPress={() => { setLoginMode('loginId'); setIdentifier(''); }}
              >
                <Text style={[styles.segmentText, loginMode === 'loginId' && styles.segmentTextActive]}>
                  Login ID
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentTab, loginMode === 'username' && styles.segmentTabActive]}
                activeOpacity={0.8}
                onPress={() => { setLoginMode('username'); setIdentifier(''); }}
              >
                <Text style={[styles.segmentText, loginMode === 'username' && styles.segmentTextActive]}>
                  Username
                </Text>
              </TouchableOpacity>
            </View>

            <InputField
              icon={loginMode === 'loginId' ? 'keypad-outline' : 'person-outline'}
              placeholder={loginMode === 'loginId' ? '4-digit Login ID' : 'Enter your Username'}
              value={identifier}
              onChangeText={(v) =>
                setIdentifier(loginMode === 'loginId' ? v.replace(/\D/g, '').slice(0, 4) : v)
              }
              keyboardType={loginMode === 'loginId' ? 'number-pad' : 'default'}
              maxLength={loginMode === 'loginId' ? 4 : undefined}
            />
            {loginMode === 'username' && (
              <InputField
                icon="lock-closed-outline"
                placeholder="Enter Your Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            )}

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRemember((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                {remember ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign In"
              onPress={onSubmit}
              loading={loading}
              style={styles.signInBtn}
            />

            <Text style={styles.demoHint}>
              {loginMode === 'loginId'
                ? 'Demo Login IDs: 1001 (Admin) • 2002 (Staff)'
                : 'Demo: Admin / admin123 • BillStaff / staff123'}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const HERO_HEIGHT = 260;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.teal },
  scroll: { flexGrow: 1, backgroundColor: colors.background },

  hero: {
    height: HERO_HEIGHT,
    backgroundColor: colors.teal,
    borderBottomLeftRadius: 140,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBubble: {
    position: 'absolute',
    left: spacing.lg,
    bottom: 60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroBubbleText: {
    color: colors.tealDark,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroImage: {
    position: 'absolute',
    right: -10,
    bottom: 0,
    width: 240,
    height: HERO_HEIGHT,
  },

  form: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.lg,
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: colors.tealDark,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  segmentTextActive: { color: '#fff' },

  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.tealDark,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.tealDark },
  rememberText: { color: colors.textMuted, fontSize: 13 },

  signInBtn: { backgroundColor: colors.tealDark, borderColor: colors.tealDark },
  demoHint: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
  },
});
