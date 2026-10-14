import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import CompatBadge from '../components/CompatBadge';
import PickerField from '../components/PickerField';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { checkCompat, ensureRequirements } from '../lib/compat';
import { friendlyError } from '../lib/errors';
import { CPU_OPTIONS, GPU_OPTIONS, findCpuOption, findGpuOption } from '../lib/hardware';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const RAM_OPTIONS = [4, 8, 16, 32, 64];
const VRAM_OPTIONS = [2, 4, 6, 8, 12, 16];
const NOT_SURE = { key: 'unknown', title: "I'm not sure", detail: 'We will skip this part of the check, so some results will show as Unknown.' };

const GPU_GROUPS = [
  { title: 'INTEGRATED GRAPHICS (built into the processor, no separate card)', options: GPU_OPTIONS.filter((o) => o.kind === 'integrated') },
  { title: 'DEDICATED GRAPHICS CARD (a separate GeForce or Radeon RX card)', options: GPU_OPTIONS.filter((o) => o.kind === 'dedicated') },
  { options: [NOT_SURE] },
];
const CPU_GROUPS = [{ options: CPU_OPTIONS }, { options: [NOT_SURE] }];

function Chips({ t, label, options, value, onChange, format }) {
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
              style={{
                flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
                borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface,
              }}
            >
              <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 12, color: on ? t.onRed : t.text }}>
                {format(o)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MyPcScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [specs, setSpecs] = useState(null);
  const [games, setGames] = useState([]);
  const [pcType, setPcType] = useState(null);
  const [ram, setRam] = useState(null);
  const [gpuKey, setGpuKey] = useState(null);
  const [vram, setVram] = useState(null);
  const [cpuKey, setCpuKey] = useState(null);
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
    const row = specRes.data;
    if (row) {
      setSpecs(row);
      if (!formLoaded.current) {
        formLoaded.current = true;
        setPcType(row.pc_type || null);
        setRam(row.ram_gb);
        const g = findGpuOption(row.gpu_tier, row.gpu_kind);
        setGpuKey(g ? g.key : null);
        setVram(row.vram_gb);
        const c = findCpuOption(row.cpu_tier);
        setCpuKey(c ? c.key : null);
        setDisk(row.disk_gb ? String(row.disk_gb) : '');
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

  const gpuOption = GPU_OPTIONS.find((o) => o.key === gpuKey) || null;
  const cpuOption = CPU_OPTIONS.find((o) => o.key === cpuKey) || null;
  const integrated = gpuOption && gpuOption.kind === 'integrated';

  async function save() {
    setError('');
    const diskNum = parseInt(disk, 10);
    setSaving(true);
    const { data, error: err } = await supabase
      .from('pc_specs')
      .upsert(
        {
          user_id: session.user.id,
          pc_type: pcType,
          ram_gb: ram,
          gpu: gpuOption ? gpuOption.title : null,
          gpu_kind: gpuOption ? gpuOption.kind : null,
          gpu_tier: gpuOption ? gpuOption.tier : null,
          vram_gb: gpuOption && gpuOption.kind === 'dedicated' ? vram : null,
          cpu: cpuOption ? cpuOption.title : null,
          cpu_tier: cpuOption ? cpuOption.tier : null,
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
  const small = { fontFamily: fonts.regular, fontSize: 12, color: t.muted, lineHeight: 17 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
      >
        <View>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>My PC</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>
            Pick your specs to see which games you can run.
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
          {(!specs || specs.gpu_tier == null) && (
            <Text style={[small, { marginTop: 12, textAlign: 'center' }]}>
              Save your specs, including your graphics, to see matches.
            </Text>
          )}
          {checking && <Text style={[small, { marginTop: 12, textAlign: 'center' }]}>Looking up game requirements…</Text>}
        </View>

        <Chips t={t} label="Type of PC" options={['laptop', 'desktop']} value={pcType} onChange={setPcType}
          format={(o) => (o === 'laptop' ? 'Laptop' : 'Desktop')} />
        {pcType === 'laptop' && (
          <Text style={small}>
            Most laptops use integrated graphics. Only gaming laptops usually have a separate graphics card.
          </Text>
        )}

        <Chips t={t} label="Memory (RAM)" options={RAM_OPTIONS} value={ram} onChange={setRam} format={(o) => `${o} GB`} />
        <Text style={[small, { marginTop: -6 }]}>If Windows says 15.2 GB usable, pick 16 GB.</Text>

        <PickerField
          label="Graphics"
          sheetTitle="Choose your graphics"
          value={gpuKey === 'unknown' || !gpuOption ? (gpuKey === 'unknown' ? "I'm not sure" : '') : gpuOption.title}
          placeholder="Tap to choose"
          groups={GPU_GROUPS}
          selectedKey={gpuKey}
          onSelect={(o) => setGpuKey(o.key)}
        />
        {gpuOption && <Text style={[small, { marginTop: -6 }]}>{gpuOption.detail}</Text>}

        {gpuOption && gpuOption.kind === 'dedicated' && (
          <Chips t={t} label="Graphics memory (VRAM)" options={VRAM_OPTIONS} value={vram} onChange={setVram} format={(o) => `${o} GB`} />
        )}
        {integrated && (
          <Text style={small}>Integrated graphics share your RAM, so there is no separate graphics memory to enter.</Text>
        )}

        <PickerField
          label="Processor"
          sheetTitle="Choose your processor"
          value={cpuKey === 'unknown' ? "I'm not sure" : cpuOption ? cpuOption.title : ''}
          placeholder="Tap to choose"
          groups={CPU_GROUPS}
          selectedKey={cpuKey}
          onSelect={(o) => setCpuKey(o.key)}
        />
        {cpuOption && <Text style={[small, { marginTop: -6 }]}>{cpuOption.detail}</Text>}

        <TextField label="Free disk space (GB)" value={disk} onChangeText={(v) => setDisk(v.replace(/\D/g, ''))}
          placeholder="e.g. 250" keyboardType="number-pad" />
        <Text style={[small, { marginTop: -6 }]}>The space left over, not the total size of your drive.</Text>

        {!!error && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{error}</Text>}
        <Button title={saved ? 'Saved ✓' : 'Save my PC'} onPress={save} loading={saving} />

        <View style={[card, { padding: 14, gap: 6 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>How to find your specs (Windows)</Text>
          <Text style={small}>• Processor and RAM: Settings, then System, then About.</Text>
          <Text style={small}>
            • Graphics: press Ctrl + Shift + Esc, open Performance, then GPU. Names like "Radeon Graphics" or "Intel UHD / Iris Xe"
            mean integrated graphics. "GeForce" or "Radeon RX" mean a separate card.
          </Text>
          <Text style={small}>• Free disk space: Settings, then System, then Storage.</Text>
        </View>

        <Text style={[small, { textAlign: 'center' }]}>
          Results are estimates. Always check the game's official requirements before you buy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
