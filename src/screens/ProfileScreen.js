import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { confirmAction, notify } from '../lib/dialog';
import features from '../features';
import { releases } from '../releases';
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
  const name = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Player';
  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };

  const [deleting, setDeleting] = useState(false);

  function deleteAccount() {
    confirmAction(
      'Delete your account?',
      'This permanently deletes your account and all your games. This cannot be undone.',
      'Delete',
      async () => {
        setDeleting(true);
        const { error } = await supabase.functions.invoke('delete-account');
        if (error) {
          setDeleting(false);
          notify('Could not delete account', 'Please try again in a moment.');
          return;
        }
        await supabase.auth.signOut({ scope: 'local' }); // returns to the login screen
      }
    );
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
          { label: 'Change password', onPress: () => navigation.navigate('ChangePassword') },
          ...(features.steamImport ? [{ label: 'Import from Steam', onPress: () => navigation.navigate('SteamImport') }] : []),
          { label: 'Backup and restore', onPress: () => navigation.navigate('Backup') },
          { label: "What's new", onPress: () => navigation.navigate('WhatsNew') },
          { label: 'Privacy Policy', onPress: () => navigation.navigate('Legal', { doc: 'privacy' }) },
          { label: 'Terms of Service', onPress: () => navigation.navigate('Legal', { doc: 'terms' }) },
          { label: 'About MyGameList', onPress: () => notify('MyGameList', `Version ${releases[0].id}\nYour Games, Your Journey.`) },
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
          onPress={deleteAccount}
          disabled={deleting}
          accessibilityRole="button"
          style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>{deleting ? 'Deleting…' : 'Delete account'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
