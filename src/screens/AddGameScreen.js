import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextField from '../components/TextField';
import Button from '../components/Button';
import { rawgGet } from '../lib/rawg';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const STATUSES = [
  { key: 'playing', label: 'Playing' },
  { key: 'completed', label: 'Completed' },
  { key: 'want_to_play', label: 'Want to Play' },
];
const STAR = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z';

export default function AddGameScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [hours, setHours] = useState('');
  const [cover, setCover] = useState(null);
  const [rawgId, setRawgId] = useState(null);
  const [status, setStatus] = useState('want_to_play');
  const [installed, setInstalled] = useState(false);
  const [rating, setRating] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const reqId = useRef(0);

  // Search RAWG as the user types (waits 400 ms after the last keystroke).
  useEffect(() => {
    const q = query.trim();
    setSearchError('');
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const json = await rawgGet('/games', { search: q, page_size: 5 });
        if (id !== reqId.current) return;
        setResults(
          (json.results || []).map((g) => ({
            id: g.id,
            name: g.name,
            cover: g.background_image,
            genre: g.genres?.[0]?.name || '',
          }))
        );
      } catch {
        if (id === reqId.current) setSearchError('Search failed. Check your connection.');
      } finally {
        if (id === reqId.current) setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  function pick(r) {
    setTitle(r.name);
    setGenre(r.genre);
    setCover(r.cover);
    setRawgId(r.id ?? null);
    setQuery('');
    setResults([]);
  }

  function reset() {
    setQuery(''); setResults([]); setTitle(''); setGenre(''); setHours('');
    setCover(null); setRawgId(null); setStatus('want_to_play'); setInstalled(false); setRating(null); setError('');
  }

  async function save() {
    setError('');
    if (!title.trim()) {
      setError('Enter the game title.');
      return;
    }
    const parsed = parseFloat(hours.replace(',', '.'));
    const hrs = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 99999) : 0;
    setSaving(true);
    const { error: err } = await supabase.from('games').insert({
      title: title.trim(),
      genre: genre.trim() || null,
      cover_url: cover,
      rawg_id: rawgId,
      status,
      is_installed: installed,
      rating,
      hours_played: hrs,
    });
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    reset();
    navigation.navigate('Library'); // the Library reloads and shows the new game
  }

  const label = { fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 };
  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
      >
        <View>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>Add game</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>
            Search for a game, or enter it yourself.
          </Text>
        </View>

        <View>
          <View>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2} strokeLinecap="round" style={{ position: 'absolute', left: 14, top: 12, zIndex: 1 }}>
              <Circle cx="11" cy="11" r="7" />
              <Path d="M20 20l-3.5-3.5" />
            </Svg>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name to auto-fill"
              placeholderTextColor={t.muted}
              accessibilityLabel="Search games by name"
              autoCorrect={false}
              style={{
                height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
                color: t.text, paddingLeft: 42, paddingRight: 14, fontFamily: fonts.regular, fontSize: 15,
              }}
            />
          </View>
          {searching && <ActivityIndicator color={t.red} style={{ marginTop: 10 }} />}
          {!!searchError && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.link, marginTop: 8 }}>{searchError}</Text>
          )}
          {results.length > 0 && (
            <View style={[card, { marginTop: 8, overflow: 'hidden' }]}>
              {results.map((r, i) => (
                <Pressable
                  key={`${r.name}-${i}`}
                  onPress={() => pick(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${r.name}`}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, minHeight: 56,
                    borderBottomWidth: i < results.length - 1 ? 1 : 0, borderBottomColor: t.border,
                  }}
                >
                  {r.cover ? (
                    <Image source={{ uri: r.cover }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: t.border }} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>{r.name}</Text>
                    {!!r.genre && <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{r.genre}</Text>}
                  </View>
                </Pressable>
              ))}
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: t.muted, padding: 8, textAlign: 'center' }}>
                Game data powered by RAWG
              </Text>
            </View>
          )}
        </View>

        {cover && (
          <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }]}>
            <Image source={{ uri: cover }} style={{ width: 56, height: 56, borderRadius: 10 }} />
            <Text style={{ flex: 1, fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>Cover added from search</Text>
            <Pressable onPress={() => setCover(null)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: t.link }}>Remove</Text>
            </Pressable>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>or enter details yourself</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
        </View>

        <TextField label="Title" value={title} onChangeText={(v) => { setTitle(v); setRawgId(null); }} placeholder="Game title" autoCapitalize="words" />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextField style={{ flex: 1 }} label="Genre" value={genre} onChangeText={setGenre} placeholder="e.g. RPG" autoCapitalize="words" />
          <TextField style={{ flex: 1 }} label="Hours played" value={hours} onChangeText={setHours} placeholder="0" keyboardType="decimal-pad" />
        </View>

        <View>
          <Text style={label}>Play status</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {STATUSES.map((s) => {
              const on = s.key === status;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setStatus(s.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{
                    flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                    borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface,
                  }}
                >
                  <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 12, color: on ? t.onRed : t.text }}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, minHeight: 56 }]}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Installed on my PC</Text>
          <Switch
            value={installed}
            onValueChange={setInstalled}
            accessibilityLabel="Installed on my PC"
            trackColor={{ false: t.border, true: t.red }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 4 }]}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Your rating</Text>
          <View style={{ flexDirection: 'row' }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = rating != null && n <= rating;
              return (
                <Pressable
                  key={n}
                  onPress={() => setRating(rating === n ? null : n)}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                  style={{ width: 44, height: 52, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill={on ? t.red : 'none'} stroke={on ? t.red : t.muted} strokeWidth={2} strokeLinejoin="round">
                    <Path d={STAR} />
                  </Svg>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!!error && (
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{error}</Text>
        )}
        <Button title="Save game" onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
