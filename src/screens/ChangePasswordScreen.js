import { useState } from 'react';
import { Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { notify } from '../lib/dialog';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

export default function ChangePasswordScreen({ navigation }) {
  const t = useTheme();
  const { session } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function save() {
    setError('');
    if (!current) { setError('Enter your current password.'); return; }
    if (password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('New passwords do not match.'); return; }

    setLoading(true);
    // Check the current password first, so a stolen unlocked phone can't change it.
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: current,
    });
    if (checkError) {
      setLoading(false);
      setError('Your current password is incorrect.');
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    notify('Password changed', 'Your password has been updated.');
    navigation.goBack();
  }

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      title="Change password"
      subtitle="Enter your current password, then choose a new one."
    >
      <TextField label="Current password" value={current} onChangeText={setCurrent}
        placeholder="Your current password" secureTextEntry autoComplete="current-password" />
      <TextField style={{ marginTop: 14 }} label="New password" value={password} onChangeText={setPassword}
        placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" />
      <TextField style={{ marginTop: 14 }} label="Confirm new password" value={confirm} onChangeText={setConfirm}
        placeholder="Repeat your new password" secureTextEntry autoComplete="new-password" />
      {!!error && (
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link, marginTop: 14 }}>
          {error}
        </Text>
      )}
      <View style={{ marginTop: 20 }}>
        <Button title="Save new password" onPress={save} loading={loading} />
      </View>
    </AuthLayout>
  );
}
