import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { Wordmark } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

// Temporary home screen. The real Library comes in the next step.
export default function LibraryScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const name = session?.user?.user_metadata?.username || session?.user?.email;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 24, paddingHorizontal: 24 }}>
      <Wordmark size={30} />
      <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.muted, marginTop: 8 }}>
        Signed in as {name}
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text, marginTop: 24 }}>
        Your library will appear here.
      </Text>
      <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 24 }}>
        <Button title="Log out" variant="secondary" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  );
}
