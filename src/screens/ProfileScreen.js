import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fonts, useTheme, useThemePreference } from '../theme';

const OPTIONS = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

export default function ProfileScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { pref, setPref } = useThemePreference();
  const user = session?.user;
  const name = user?.user_metadata?.username || 'Player';
  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };

  async function changePassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) Alert.alert('Could not send email', error.message);
    else Alert.alert('Check your email', 'We sent a link to reset your password.');
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20, gap: 16, flexGrow: 1 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: t.text, fontSize: 22, marginTop: -2 }}>‹</Text>
        </Pressable>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>Profile</Text>
      </View>

      <View style={[card, { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: t.onRed }}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text }}>{name}</Text>
          <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>{user?.email}</Text>
        </View>
      </View>

      <View style={[card, { padding: 14 }]}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text, marginBottom: 10 }}>Appearance</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {OPTIONS.map((o) => {
            const on = pref === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => setPref(o.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{ flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface }}
              >
                <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 13, color: on ? t.onRed : t.text }}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={card}>
        {[
          { label: 'Change password', onPress: changePassword },
          { label: 'About MyGameList', onPress: () => Alert.alert('MyGameList', 'Version 1.0.0\nYour Games, Your Journey.') },
        ].map((r, i, arr) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            accessibilityRole="button"
            style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: t.border }}
          >
            <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>{r.label}</Text>
            <Text style={{ color: t.muted, fontSize: 20 }}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 'auto', gap: 6 }}>
        <Button title="Log out" variant="secondary" onPress={() => supabase.auth.signOut()} />
        <Pressable
          onPress={() => Alert.alert('Coming soon', 'Account deletion will be added in a later step.')}
          accessibilityRole="button"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>Delete account</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
