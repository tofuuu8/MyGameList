import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import CompatBadge from '../components/CompatBadge';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { checkCompat, ensureRequirements } from '../lib/compat';
import { friendlyError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const RAM_OPTIONS = [4, 8, 16, 32, 64];
const VRAM_OPTIONS = [2, 4, 6, 8, 12, 16];

export default function MyPcScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [specs, setSpecs] = useState(null);
  const [games, setGames] = useState([]);
  const [ram, setRam] = useState(null);
  const [vram, setVram] = useState(null);
  const [gpu, setGpu] = useState('');
  const [cpu, setCpu] = useState('');
  const [disk, setDisk] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const formLoaded = useRef(false);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  const load = useCallback(async () => {
    const [specRes, gameRes] = await Promise.all([
      supabase.from('pc_specs').select('*').maybeSingle(),
      supabase.from('games').select('*'),
    ]);
    if (!alive.current) return;
    if (specRes.data) {
      setSpecs(specRes.data);
      if (!formLoaded.current) {
        formLoaded.current = true;
        setRam(specRes.data.ram_gb);
        setVram(specRes.data.vram_gb);
        setGpu(specRes.data.gpu || '');
        setCpu(specRes.data.cpu || '');
        setDisk(specRes.data.disk_gb ? String(specRes.data.disk_gb) : '');
      }
    }
    const list = gameRes.data || [];
    setGames(list);

    // Look up requirements for games that haven't been checked yet (a few per visit).
    const todo = list.filter((g) => !g.req_checked).slice(0, 8);
    if (todo.length === 0) return;
    setChecking(true);
    for (const g of todo) {
      if (!alive.current) return;
      try {
        const updated = await ensureRequirements(g);
        if (alive.current) setGames((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      } catch {
        break; // network or rate limit problem: try again next visit
      }
    }
    if (alive.current) setChecking(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const counts = useMemo(() => {
    const c = { can: 0, might: 0, unknown: 0 };
    games.forEach((g) => { c[checkCompat(g, specs).status] += 1; });
    return c;
  }, [games, specs]);

  async function save() {
    setError('');
    const diskNum = parseInt(disk, 10);
    setSaving(true);
    const { data, error: err } = await supabase
      .from('pc_specs')
      .upsert(
        {
          user_id: session.user.id,
          ram_gb: ram,
          gpu: gpu.trim() || null,
          vram_gb: vram,
          cpu: cpu.trim() || null,
          disk_gb: diskNum > 0 ? diskNum : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    setSaving(false);
    if (err) { setError(friendlyError(err)); return; }
    setSpecs(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };

  function Chips({ label, options, value, onChange }) {
    return (
      <View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 }}>{label}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {options.map((o) => {
            const on = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => onChange(on ? null : o)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{ flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface }}
              >
                <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 12, color: on ? t.onRed : t.text }}>{o} GB</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
      >
        <View>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>My PC</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>
            Enter your specs to see which games you can run.
          </Text>
        </View>

        <View style={[card, { padding: 14 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text, marginBottom: 12 }}>Your library on this PC</Text>
          <View style={{ flexDirection: 'row' }}>
            {[['can', counts.can], ['might', counts.might], ['unknown', counts.unknown]].map(([k, n]) => (
              <View key={k} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>{n}</Text>
                <CompatBadge status={k} />
              </View>
            ))}
          </View>
          {!specs && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, marginTop: 12, textAlign: 'center' }}>
              Save your specs below to see matches.
            </Text>
          )}
          {checking && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, marginTop: 12, textAlign: 'center' }}>
              Looking up game requirements…
            </Text>
          )}
        </View>

        <Chips label="Memory (RAM)" options={RAM_OPTIONS} value={ram} onChange={setRam} />
        <TextField label="Graphics card (GPU)" value={gpu} onChangeText={setGpu} placeholder="e.g. NVIDIA GeForce RTX 3060" autoCapitalize="words" />
        <Chips label="Graphics memory (VRAM)" options={VRAM_OPTIONS} value={vram} onChange={setVram} />
        <TextField label="Processor (CPU)" value={cpu} onChangeText={setCpu} placeholder="e.g. Intel Core i5-10400" autoCapitalize="words" />
        <TextField label="Free disk space (GB)" value={disk} onChangeText={(v) => setDisk(v.replace(/\D/g, ''))} placeholder="e.g. 250" keyboardType="number-pad" />

        {!!error && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{error}</Text>}
        <Button title={saved ? 'Saved ✓' : 'Save my PC'} onPress={save} loading={saving} />
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, textAlign: 'center', lineHeight: 17 }}>
          Matches are estimates based on RAM, graphics memory and disk space.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
