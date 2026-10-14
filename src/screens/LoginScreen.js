import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIconTile } from '../components/Logo';
import TextField from '../components/TextField';
import Button from '../components/Button';
import GoogleButton from '../components/GoogleButton';
import LegalNote from '../components/LegalNote';
import features from '../features';
import { friendlyError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

export default function LoginScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    // On success the auth listener swaps in the app screens automatically.
    if (err) {
      if (/not confirmed/i.test(err.message)) {
        // Account exists but the email was never verified: send a fresh code.
        await supabase.auth.resend({ type: 'signup', email: email.trim() });
        navigation.navigate('VerifyEmail', { email: email.trim() });
      } else {
        setError(friendlyError(err));
      }
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
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 24,
        }}
      >
        <AppIconTile size={72} />
        <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: t.text, marginTop: 22 }}>
          Welcome back
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, marginTop: 4, marginBottom: 28 }}>
          Log in to your game library.
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          style={{ marginTop: 16 }}
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
        />

        <Pressable
          onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
          accessibilityRole="link"
          style={{ alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>
            Forgot password?
          </Text>
        </Pressable>

        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link, marginBottom: 12 }}
          >
            {error}
          </Text>
        )}

        <Button title="Log in" onPress={handleLogin} loading={loading} />

        {features.googleSignIn && (
          <>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, textAlign: 'center', marginVertical: 14 }}>
            or
          </Text>
          <GoogleButton onError={setError} />
          </>
        )}
        <LegalNote navigation={navigation} />

        <View style={{ flex: 1, minHeight: 24 }} />
        <Pressable
          onPress={() => navigation.navigate('SignUp')}
          accessibilityRole="link"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted }}>
            New here?{' '}
            <Text style={{ fontFamily: fonts.bold, color: t.link }}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
