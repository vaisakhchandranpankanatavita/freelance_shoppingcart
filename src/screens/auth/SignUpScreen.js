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
import { useFeedback } from '../../components/Feedback';
import PrimaryButton from '../../components/PrimaryButton';
import AuthHero from './AuthHero';
import Receipt, { Perforation, ReceiptHeader } from '../../components/Receipt';
import { colors, spacing } from '../../theme';
import { enter } from '../../theme/motion';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { signUp, loading } = useAuth();
  const { toast } = useFeedback();
  const [username, setUsername] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(true);

  const onSubmit = async () => {
    if (!username || !loginId || !password) {
      toast({ tone: 'error', title: 'Fill in every field', message: 'Username, Login ID and password are required.' });
      return;
    }
    if (password !== confirm) {
      toast({ tone: 'error', title: "Passwords don't match", message: 'Type the same password in both fields.' });
      return;
    }
    if (!agree) {
      toast({ tone: 'info', title: 'Accept the terms', message: 'Tick the box to create your account.' });
      return;
    }
    try {
      await signUp({ username, loginId, password });
    } catch (e) {
      toast({ tone: 'error', title: "Couldn't create the account", message: e.message });
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
            title="Create account"
            subtitle="Set up a staff login for this store."
            switchLabel="Sign in"
            switchIcon="log-in-outline"
            onSwitch={() => navigation.navigate('Login')}
          />

          <Receipt style={styles.receipt}>
            <ReceiptHeader title="New staff" />
            <Perforation />
            <Animated.View entering={enter(3)}>
              <InputField label="Username" icon="person-outline" placeholder="Username" value={username} onChangeText={setUsername} />
            </Animated.View>
            <Animated.View entering={enter(4)}>
              <InputField label="Login ID" icon="at-outline" placeholder="Login ID" value={loginId} onChangeText={setLoginId} />
            </Animated.View>
            <Animated.View entering={enter(5)}>
              <InputField label="Password" icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            </Animated.View>
            <Animated.View entering={enter(6)}>
              <InputField label="Confirm password" icon="lock-closed-outline" placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
            </Animated.View>

            <Animated.View entering={enter(7)}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setAgree((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agree }}
              >
                <View style={[styles.checkbox, agree && styles.checkboxOn]}>
                  {agree ? <Icon name="checkmark" size={14} color={colors.ink} /> : null}
                </View>
                <Text style={styles.rememberText}>
                  I agree to the <Text style={styles.link}>Terms & Conditions</Text> and{' '}
                  <Text style={styles.link}>Privacy Policy</Text>
                </Text>
              </Pressable>

              <PrimaryButton
                title="Create account"
                icon="person-add-outline"
                variant="light"
                onPress={onSubmit}
                loading={loading}
              />
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    marginLeft: spacing.sm,
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
  rememberText: { color: colors.textMuted, fontSize: 13, flex: 1 },
  link: { color: colors.text, fontWeight: '700' },
});
