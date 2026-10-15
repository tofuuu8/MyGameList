import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import CompatBadge from '../components/CompatBadge';
import { checkCompat, ensureRequirements } from '../lib/compat';
import { confirmAction, notify } from '../lib/dialog';
import { friendlyError } from '../lib/errors';
import { STATUSES } from '../lib/status';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const STAR = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z';
const COVER_COLORS = ['#8A1620', '#B01E2B', '#4A4A4A', '#6B1018', '#2F2F2F', '#7A1A24'];

export default function GameDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [notes, setNotes] = useState('');
  const [addHours, setAddHours] = useState('');
  const [goalText, setGoalText] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [specs, setSpecs] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);
  const savedTimer = useRef(null);

  useEffect(() => {
    let off = false;
    supabase.from('games').select('*').eq('id', id).single().then(({ data, error: err }) => {
      if (off) return;
      if (err || !data) {
        setError(err?.message || 'Game not found.');
      } else {
        setGame(data);
        setTitle(data.title);
        setGenre(data.genre || '');
        setNotes(data.notes || '');
        setGoalText(data.goal_hours ? String(Number(data.goal_hours)) : '');
      }
      setLoading(false);
    });
    return () => { off = true; clearTimeout(savedTimer.current); };
  }, [id]);

  useEffect(() => {
    supabase.from('pc_specs').select('*').maybeSingle().then(({ data }) => setSpecs(data || null));
  }, []);

  // Look up the game's minimum requirements the first time it is opened.
  useEffect(() => {
    if (!game || game.req_checked) return undefined;
    let off = false;
    setReqLoading(true);
    ensureRequirements(game)
      .then((g) => {
        if (off) return;
        setGame((prev) => (prev ? {
          ...prev, rawg_id: g.rawg_id, min_ram_gb: g.min_ram_gb, min_vram_gb: g.min_vram_gb,
          min_disk_gb: g.min_disk_gb, min_gpu: g.min_gpu, min_cpu: g.min_cpu, req_checked: g.req_checked,
        } : prev));
      })
      .catch(() => {})
      .finally(() => { if (!off) setReqLoading(false); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game && game.id]);

  // Saves changes right away. Reverts the screen if saving fails.
  async function patch(fields) {
    const prev = game;
    setGame({ ...game, ...fields });
    const { error: err } = await supabase.from('games').update(fields).eq('id', id);
    if (err) {
      setGame(prev);
      notify('Could not save', friendlyError(err));
      return false;
    }
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 1500);
    return true;
  }

  function saveTitle() {
    const next = title.trim();
    if (!next) { setTitle(game.title); return; }
    if (next !== game.title) patch({ title: next });
  }
  function saveGenre() {
    const next = genre.trim() || null;
    if (next !== (game.genre || null)) patch({ genre: next });
  }
  function saveNotes() {
    const next = notes.trim() || null;
    if (next !== (game.notes || null)) patch({ notes: next });
  }

  async function saveGoal() {
    const n = parseFloat(goalText.replace(',', '.'));
    if (!(n > 0)) {
      notify('Enter a goal', 'Type how many hours you want to play, like 20.');
      return;
    }
    await patch({ goal_hours: Math.min(Math.round(n * 10) / 10, 99999) });
  }

  async function clearGoal() {
    if (await patch({ goal_hours: null })) setGoalText('');
  }

  async function logTime() {
    const n = parseFloat(addHours.replace(',', '.'));
    if (!(n > 0)) {
      notify('Enter hours', 'Type how many hours you played, like 1.5.');
      return;
    }
    const total = Math.min(Math.round((Number(game.hours_played) + n) * 10) / 10, 99999);
    if (await patch({ hours_played: total })) setAddHours('');
  }

  function remove() {
    confirmAction('Delete this game?', `"${game.title}" will be removed from your library.`, 'Delete', async () => {
      setDeleting(true);
      const { error: err } = await supabase.from('games').delete().eq('id', id);
      if (err) {
        setDeleting(false);
        notify('Could not delete', friendlyError(err));
        return;
      }
      navigation.goBack();
    });
  }

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };
  const backButton = (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={{
        position: 'absolute', top: insets.top + 8, left: 16, width: 44, height: 44, borderRadius: 22,
        backgroundColor: t.bg + 'CC', alignItems: 'center', justifyContent: 'center', zIndex: 2,
      }}
    >
      <Text style={{ color: t.text, fontSize: 24, marginTop: -2 }}>‹</Text>
    </Pressable>
  );

  if (loading || !game) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, padding: 20, paddingTop: insets.top + 70 }}>
        {backButton}
        {loading ? (
          <ActivityIndicator color={t.red} />
        ) : (
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.link }}>{error}</Text>
        )}
      </View>
    );
  }

  const compat = checkCompat(game, specs);
  const reqParts = [
    game.min_ram_gb != null && `${Number(game.min_ram_gb)} GB RAM`,
    game.min_vram_gb != null && `${Number(game.min_vram_gb)} GB graphics memory`,
    game.min_disk_gb != null && `${Number(game.min_disk_gb)} GB disk space`,
  ].filter(Boolean);
  const reqLine = reqParts.length
    ? `Minimum: ${reqParts.join(' · ')}`
    : game.req_checked
      ? 'No requirements found for this game.'
      : reqLoading ? 'Looking up requirements…' : 'Requirements not checked yet.';

  const hash = [...game.title].reduce((n, c) => n + c.charCodeAt(0), 0);
  const rating = game.rating != null ? Number(game.rating) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {backButton}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        {game.cover_url ? (
          <Image source={{ uri: game.cover_url }} style={{ width: '100%', height: 220 + insets.top }} resizeMode="cover" />
        ) : (
          <View style={{ height: 220 + insets.top, backgroundColor: COVER_COLORS[hash % COVER_COLORS.length], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 64, color: '#FFFFFF' }}>{game.title.charAt(0).toUpperCase()}</Text>
          </View>
        )}

        <View style={{ padding: 20, gap: 14 }}>
          <View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              onBlur={saveTitle}
              accessibilityLabel="Game title"
              style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text, padding: 0 }}
            />
            <TextInput
              value={genre}
              onChangeText={setGenre}
              onBlur={saveGenre}
              placeholder="Add a genre"
              placeholderTextColor={t.muted}
              accessibilityLabel="Genre"
              style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, padding: 0, marginTop: 4 }}
            />
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: saved ? t.link : t.muted, marginTop: 6 }}>
              {saved ? 'Saved ✓' : 'Tap the title or genre to edit them.'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {STATUSES.map((s) => {
              const on = s.key === game.status;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => !on && patch({ status: s.key })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={{ flexBasis: '47%', flexGrow: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface }}
                >
                  <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 12, color: on ? t.onRed : t.text }}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, minHeight: 56 }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Installed on my PC</Text>
            <Switch
              value={game.is_installed}
              onValueChange={(v) => patch({ is_installed: v })}
              accessibilityLabel="Installed on my PC"
              trackColor={{ false: t.border, true: t.red }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[card, { padding: 14, gap: 8 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>System requirements</Text>
              {reqLoading ? <ActivityIndicator color={t.red} size="small" /> : <CompatBadge status={compat.status} />}
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>{reqLine}</Text>
            {compat.reasons.map((r) => (
              <Text key={r} style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{r}</Text>
            ))}
            {compat.notes.map((n) => (
              <Text key={n} style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{n}</Text>
            ))}
            {(!specs || specs.gpu_tier == null) && (
              <Pressable
                onPress={() => navigation.navigate('Main', { screen: 'My PC' })}
                accessibilityRole="button"
                style={{ minHeight: 40, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: t.link }}>{specs ? 'Choose your graphics in My PC ›' : 'Set up My PC to see if you can run it ›'}</Text>
              </Pressable>
            )}
          </View>

          <View style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, paddingRight: 4 }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Rating</Text>
            <View style={{ flexDirection: 'row' }}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = rating != null && n <= rating;
                return (
                  <Pressable
                    key={n}
                    onPress={() => patch({ rating: rating === n ? null : n })}
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

          <View style={[card, { padding: 14, gap: 10 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Playtime</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: t.text }}>{Number(game.hours_played)} h</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={addHours}
                onChangeText={setAddHours}
                placeholder="Hours to add, e.g. 1.5"
                placeholderTextColor={t.muted}
                keyboardType="decimal-pad"
                accessibilityLabel="Hours to add"
                style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg, color: t.text, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15 }}
              />
              <Pressable
                onPress={logTime}
                accessibilityRole="button"
                style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.onRed }}>Log time</Text>
              </Pressable>
            </View>
          </View>

          <View style={[card, { padding: 14, gap: 10 }]}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>Play-time goal</Text>
            {game.goal_hours ? (
              <>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: t.track, overflow: 'hidden' }}>
                  <View style={{ height: 10, backgroundColor: t.red, width: `${Math.min(100, (Number(game.hours_played) / Number(game.goal_hours)) * 100)}%` }} />
                </View>
                <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>
                  {Number(game.hours_played) >= Number(game.goal_hours)
                    ? `Goal reached ✓  ${Number(game.hours_played)} of ${Number(game.goal_hours)} h`
                    : `${Number(game.hours_played)} of ${Number(game.goal_hours)} h  ·  ${Math.round((Number(game.hours_played) / Number(game.goal_hours)) * 100)}%`}
                </Text>
              </>
            ) : (
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>Set a target number of hours for this game.</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={goalText}
                onChangeText={setGoalText}
                placeholder="Goal in hours, e.g. 20"
                placeholderTextColor={t.muted}
                keyboardType="decimal-pad"
                accessibilityLabel="Goal in hours"
                style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.bg, color: t.text, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15 }}
              />
              <Pressable
                onPress={saveGoal}
                accessibilityRole="button"
                style={{ height: 44, paddingHorizontal: 18, borderRadius: 12, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.onRed }}>Set goal</Text>
              </Pressable>
            </View>
            {!!game.goal_hours && (
              <Pressable onPress={clearGoal} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: t.link }}>Remove goal</Text>
              </Pressable>
            )}
          </View>

          <View style={[card, { padding: 14 }]}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, marginBottom: 6 }}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              onBlur={saveNotes}
              placeholder="Add your notes"
              placeholderTextColor={t.muted}
              multiline
              accessibilityLabel="Notes"
              style={{ fontFamily: fonts.regular, fontSize: 14, color: t.text, minHeight: 72, textAlignVertical: 'top', padding: 0, lineHeight: 20 }}
            />
          </View>

          <Button title="Delete game" variant="secondary" loading={deleting} onPress={remove} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
