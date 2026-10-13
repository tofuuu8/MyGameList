import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen({ navigation, route }) {
  const t = useTheme();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    setError('');
    const address = email.trim();
    if (!EMAIL_RE.test(address)) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(address);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigation.navigate('ResetPassword', { email: address });
  }

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      title="Forgot password?"
      subtitle="Enter your email and we will send you a code to reset your password."
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
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link, marginTop: 14 }}>
          {error}
        </Text>
      )}
      <View style={{ marginTop: 20 }}>
        <Button title="Send code" onPress={send} loading={loading} />
      </View>
    </AuthLayout>
  );
}
