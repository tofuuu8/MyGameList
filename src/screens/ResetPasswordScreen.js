import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

export default function ResetPasswordScreen({ navigation, route }) {
  const t = useTheme();
  const { setRecovering } = useAuth();
  const email = route.params?.email ?? '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Never leave the app waiting on this screen if the user walks away.
  useEffect(() => () => setRecovering(false), [setRecovering]);

  async function submit() {
    setError('');
    setInfo('');
    if (!verified && code.trim().length < 6) {
      setError('Enter the code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    if (!verified) {
      // Checking the code signs the user in, so tell the app to wait for the new password.
      setRecovering(true);
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'recovery',
      });
      if (verifyError) {
        setRecovering(false);
        setLoading(false);
        setError('That code is wrong or has expired. Check it, or request a new one.');
        return;
      }
      setVerified(true);
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(friendlyError(updateError));
      return;
    }
    setRecovering(false); // opens the app, signed in with the new password
  }

  async function resend() {
    if (cooldown > 0) return;
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email);
    if (err) {
      setError(friendlyError(err));
    } else {
      setInfo('We sent you a new code.');
      setCooldown(60);
    }
  }

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      title="Reset password"
      subtitle={`We sent a code to ${email}. Enter it with your new password.`}
      footer={
        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>Back to log in</Text>
        </Pressable>
      }
    >
      {!verified && (
        <TextField
          label="Verification code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={10}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          inputStyle={{ fontFamily: fonts.bold, fontSize: 24, letterSpacing: 6, textAlign: 'center', height: 56 }}
        />
      )}
      <TextField
        style={{ marginTop: 14 }}
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        style={{ marginTop: 14 }}
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Repeat your new password"
        secureTextEntry
        autoComplete="new-password"
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
        <Button title="Save new password" onPress={submit} loading={loading} />
      </View>

      {!verified && (
        <Pressable
          onPress={resend}
          disabled={cooldown > 0}
          accessibilityRole="button"
          style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: cooldown > 0 ? t.muted : t.link }}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </Text>
        </Pressable>
      )}
    </AuthLayout>
  );
}
