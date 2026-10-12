import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

export default function VerifyEmailScreen({ navigation, route }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const email = route.params?.email ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleVerify() {
    setError('');
    setInfo('');
    if (code.trim().length < 6) {
      setError('Enter the code from your email.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: 'signup',
    });
    setLoading(false);
    // On success the auth listener opens the app automatically.
    if (err) setError('That code is wrong or has expired. Check it, or request a new one.');
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError('');
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    if (err) {
      setError(err.message);
    } else {
      setInfo('We sent you a new code.');
      setCooldown(60);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: t.border,
            backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: t.text, fontSize: 22, marginTop: -2 }}>‹</Text>
        </Pressable>

        <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: t.text, marginTop: 22 }}>
          Check your email
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, marginTop: 4, marginBottom: 28 }}>
          We sent a verification code to {email}. Enter it below to confirm your account.
        </Text>

        <TextField
          label="Verification code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          inputStyle={{ fontFamily: fonts.bold, fontSize: 24, letterSpacing: 6, textAlign: 'center', height: 56 }}
        />

        {!!error && (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link, marginTop: 14 }}>
            {error}
          </Text>
        )}
        {!!info && (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 14 }}>
            {info}
          </Text>
        )}

        <View style={{ marginTop: 20 }}>
          <Button title="Verify" onPress={handleVerify} loading={loading} />
        </View>

        <Pressable
          onPress={handleResend}
          disabled={cooldown > 0}
          accessibilityRole="button"
          style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: cooldown > 0 ? t.muted : t.link }}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </Pressable>

        <View style={{ flex: 1, minHeight: 24 }} />
        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>Back to log in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
