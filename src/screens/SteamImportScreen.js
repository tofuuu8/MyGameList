import { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../lib/errors';
import { fetchSteamLibrary, loadExistingGames, planImport, runImport } from '../lib/steam';
import { fonts, useTheme } from '../theme';

const KEY = 'steam-input';

export default function SteamImportScreen({ navigation }) {
  const t = useTheme();
  const { session } = useAuth();
  const [step, setStep] = useState('input'); // input | preview | importing | done
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [steamGames, setSteamGames] = useState([]);
  const [existing, setExisting] = useState([]);
  const [includeUnplayed, setIncludeUnplayed] = useState(true);
  const [playedStatus, setPlayedStatus] = useState('playing');
  const [progress, setProgress] = useState([0, 0]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => { if (v) setInput(v); }).catch(() => {});
  }, []);

  const plan = useMemo(
    () => planImport(steamGames, existing, { includeUnplayed, playedStatus }),
    [steamGames, existing, includeUnplayed, playedStatus]
  );

  async function find() {
    setError('');
    if (!input.trim()) {
      setError('Enter your Steam profile link, custom name or Steam ID.');
      return;
    }
    setLoading(true);
    try {
      const [lib, current] = await Promise.all([fetchSteamLibrary(input.trim()), loadExistingGames()]);
      AsyncStorage.setItem(KEY, input.trim()).catch(() => {});
      setSteamGames(lib.games);
      setExisting(current);
      setStep('preview');
    } catch (e) {
      setError(friendlyError(e));
    }
    setLoading(false);
  }

  async function doImport() {
    setStep('importing');
    setProgress([0, plan.inserts.length + plan.updates.length]);
    try {
      await runImport(plan, session.user.id, (d, n) => setProgress([d, n]));
      setResult({ added: plan.inserts.length, updated: plan.updates.length });
      setStep('done');
    } catch (e) {
      setError(friendlyError(e));
      setStep('preview');
    }
  }

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14 };
  const body = { fontFamily: fonts.regular, fontSize: 13, color: t.muted, lineHeight: 19 };
  const strong = { fontFamily: fonts.bold, color: t.text };

  const chip = (key, label) => {
    const on = playedStatus === key;
    return (
      <Pressable
        key={key}
        onPress={() => setPlayedStatus(key)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={{ flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface }}
      >
        <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 13, color: on ? t.onRed : t.text }}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      title="Import from Steam"
      subtitle="Bring your Steam games into your library, with covers and hours played."
      footer={<Text style={[body, { textAlign: 'center', marginTop: 16 }]}>Game data from Steam</Text>}
    >
      {step === 'input' && (
        <View style={{ gap: 14 }}>
          <View style={card}>
            <Text style={[body, strong]}>Before you start</Text>
            <Text style={[body, { marginTop: 6 }]}>
              In Steam, open your profile, choose Edit Profile, then Privacy Settings, and set <Text style={strong}>Game details</Text> to <Text style={strong}>Public</Text>. You can set it back to Private after importing.
            </Text>
          </View>
          <TextField
            label="Steam profile link, custom name or ID"
            value={input}
            onChangeText={setInput}
            placeholder="steamcommunity.com/id/yourname"
          />
          <Text style={[body, { marginTop: -6 }]}>Your custom name is the part after /id/ in your profile link.</Text>
          {!!error && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{error}</Text>}
          <Button title="Find my games" onPress={find} loading={loading} />
        </View>
      )}

      {step === 'preview' && (
        <View style={{ gap: 14 }}>
          <View style={card}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: t.text }}>{steamGames.length} games found</Text>
            <Text style={[body, { marginTop: 4 }]}>
              This will add <Text style={strong}>{plan.inserts.length}</Text> new {plan.inserts.length === 1 ? 'game' : 'games'}
              {plan.updates.length > 0 ? ` and update ${plan.updates.length} you already have` : ''}.
              {plan.skipped > 0 ? ` ${plan.skipped} will be skipped.` : ''}
            </Text>
          </View>

          <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Include games I haven't played</Text>
              <Text style={body}>They are added as Want to Play.</Text>
            </View>
            <Switch value={includeUnplayed} onValueChange={setIncludeUnplayed} accessibilityLabel="Include games I haven't played"
              trackColor={{ false: t.border, true: t.red }} thumbColor="#FFFFFF" />
          </View>

          <View>
            <Text style={[body, { marginBottom: 6 }]}>Mark games I have played as</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {chip('playing', 'Playing')}
              {chip('completed', 'Completed')}
            </View>
          </View>

          {!!error && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{error}</Text>}
          <Button
            title={plan.inserts.length + plan.updates.length === 0 ? 'Nothing to import' : `Import ${plan.inserts.length + plan.updates.length} ${plan.inserts.length + plan.updates.length === 1 ? 'game' : 'games'}`}
            onPress={doImport}
            loading={false}
          />
          <Button title="Back" variant="secondary" onPress={() => { setStep('input'); setError(''); }} />
        </View>
      )}

      {step === 'importing' && (
        <View style={[card, { gap: 8 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text }}>Importing…</Text>
          <Text style={body}>{progress[0]} of {progress[1]} done. Please keep this screen open.</Text>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: t.track, overflow: 'hidden', marginTop: 4 }}>
            <View style={{ height: 8, backgroundColor: t.red, width: `${progress[1] ? (progress[0] / progress[1]) * 100 : 0}%` }} />
          </View>
        </View>
      )}

      {step === 'done' && result && (
        <View style={{ gap: 14 }}>
          <View style={card}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: t.text }}>All done</Text>
            <Text style={[body, { marginTop: 4 }]}>
              Added {result.added} {result.added === 1 ? 'game' : 'games'}
              {result.updated > 0 ? ` and updated ${result.updated}` : ''}. Running it again later only adds new games and raises your hours.
            </Text>
          </View>
          <Button title="View my library" onPress={() => navigation.navigate('Main', { screen: 'Library' })} />
        </View>
      )}
    </AuthLayout>
  );
}
