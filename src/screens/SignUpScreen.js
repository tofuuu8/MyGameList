import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark, Wordmark } from '../components/Logo';
import TextField from '../components/TextField';
import Button from '../components/Button';
import LegalNote from '../components/LegalNote';
import { friendlyError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return '';
  }

  async function handleSignUp() {
    const problem = validate();
    setError(problem);
    if (problem) return;

    setLoading(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim() } },
    });
    setLoading(false);

    if (err) {
      setError(friendlyError(err));
      return;
    }
    // Supabase hides whether an email is taken: an existing account comes back with no identities.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError('An account with this email already exists. Try logging in.');
      return;
    }
    // With email confirmation on, there is no session yet: ask for the emailed code.
    if (!data.session) {
      navigation.navigate('VerifyEmail', { email: email.trim() });
    }
    // If a session exists, the auth listener opens the app automatically.
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
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{
              width: 44, height: 44, borderRadius: 22, borderWidth: 1,
              borderColor: t.border, backgroundColor: t.surface,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: t.text, fontSize: 22, marginTop: -2 }}>‹</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LogoMark width={32} body={t.red} detail={t.bg} />
            <Wordmark size={19} />
          </View>
        </View>

        <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: t.text, marginTop: 22 }}>
          Create account
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, marginTop: 4, marginBottom: 24 }}>
          Start tracking every game you own.
        </Text>

        <TextField label="Username" value={username} onChangeText={setUsername}
          placeholder="Player one" autoComplete="username-new" />
        <TextField style={{ marginTop: 14 }} label="Email" value={email} onChangeText={setEmail}
          placeholder="you@example.com" keyboardType="email-address" autoComplete="email" />
        <TextField style={{ marginTop: 14 }} label="Password" value={password} onChangeText={setPassword}
          placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" />
        <TextField style={{ marginTop: 14 }} label="Confirm password" value={confirm} onChangeText={setConfirm}
          placeholder="Repeat your password" secureTextEntry autoComplete="new-password" />

        {!!error && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link, marginTop: 14 }}
          >
            {error}
          </Text>
        )}

        <View style={{ marginTop: 20 }}>
          <Button title="Sign up" onPress={handleSignUp} loading={loading} />
          <LegalNote navigation={navigation} prefix="By signing up, you agree to our" />
        </View>

        <View style={{ flex: 1, minHeight: 24 }} />
        <Pressable
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted }}>
            Already have an account?{' '}
            <Text style={{ fontFamily: fonts.bold, color: t.link }}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
