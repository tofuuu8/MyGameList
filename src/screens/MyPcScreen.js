import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import CompatBadge from '../components/CompatBadge';
import PasteSpecsSheet from '../components/PasteSpecsSheet';
import PickerField from '../components/PickerField';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { checkCompat, ensureRequirements } from '../lib/compat';
import { confirmAction } from '../lib/dialog';
import { friendlyError } from '../lib/errors';
import { CPU_OPTIONS, GPU_OPTIONS, findCpuOption, findGpuOption } from '../lib/hardware';
import { fetchAllGames } from '../lib/paged';
import { deletePc, loadPcs, savePc, setActivePc } from '../lib/pcs';
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

const friendlySaveError = (e) =>
  /does not exist|schema cache/i.test(String((e && e.message) || ''))
    ? 'Your database needs the latest update first. Run the SQL file that came with this update in Supabase, then try again.'
    : friendlyError(e);

export default function MyPcScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [pcs, setPcs] = useState([]);
  const [currentId, setCurrentId] = useState(null); // null means a new PC that is not saved yet
  const [games, setGames] = useState([]);
  const [name, setName] = useState('My PC');
  const [pcType, setPcType] = useState(null);
  const [ram, setRam] = useState(null);
  const [gpuKey, setGpuKey] = useState(null);
  const [vram, setVram] = useState(null);
  const [cpuKey, setCpuKey] = useState(null);
  const [disk, setDisk] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [checking, setChecking] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const formLoaded = useRef(false);
  const alive = useRef(true);

  useEffect(() => () => { alive.current = false; }, []);

  // Puts a saved PC (or a blank new one) into the form.
  const fillForm = useCallback((pc, hasOthers) => {
    setError('');
    setNote('');
    if (!pc) {
      setCurrentId(null);
      setName(hasOthers ? 'New PC' : 'My PC');
      setPcType(null); setRam(null); setGpuKey(null); setVram(null); setCpuKey(null); setDisk('');
      return;
    }
    setCurrentId(pc.id);
    setName(pc.name || 'My PC');
    setPcType(pc.pc_type || null);
    setRam(pc.ram_gb);
    const g = findGpuOption(pc.gpu_tier, pc.gpu_kind);
    setGpuKey(g ? g.key : null);
    setVram(pc.vram_gb);
    const c = findCpuOption(pc.cpu_tier);
    setCpuKey(c ? c.key : null);
    setDisk(pc.disk_gb ? String(pc.disk_gb) : '');
  }, []);

  const load = useCallback(async () => {
    let pcList = [];
    let gameList = [];
    try { pcList = await loadPcs(); } catch { /* database not updated yet: treated as no saved PC */ }
    try { gameList = await fetchAllGames(); } catch { /* shown as an empty library */ }
    if (!alive.current) return;
    setPcs(pcList);
    if (!formLoaded.current) {
      formLoaded.current = true;
      fillForm(pcList.find((p) => p.is_active) || pcList[0] || null, pcList.length > 0);
    }
    setGames(gameList);

    // Look up requirements for games that haven't been checked yet (a few per visit).
    const todo = gameList.filter((g) => !g.req_checked).slice(0, 8);
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
  }, [fillForm]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const activePc = pcs.find((p) => p.is_active) || pcs[0] || null;

  const counts = useMemo(() => {
    const c = { can: 0, might: 0, unknown: 0 };
    games.forEach((g) => { c[checkCompat(g, activePc).status] += 1; });
    return c;
  }, [games, activePc]);

  const gpuOption = GPU_OPTIONS.find((o) => o.key === gpuKey) || null;
  const cpuOption = CPU_OPTIONS.find((o) => o.key === cpuKey) || null;
  const integrated = gpuOption && gpuOption.kind === 'integrated';

  async function choosePc(pc) {
    if (pc.id === currentId) return;
    try {
      if (!pc.is_active) {
        await setActivePc(session.user.id, pc.id);
        setPcs((list) => list.map((p) => ({ ...p, is_active: p.id === pc.id })));
      }
      fillForm(pc, true);
    } catch (e) {
      setError(friendlySaveError(e));
    }
  }

  function applyPasted(r) {
    if (r.pcType) setPcType(r.pcType);
    if (r.ram) setRam(r.ram);
    if (r.gpu) {
      const g = findGpuOption(r.gpu.tier, r.gpu.kind);
      if (g) setGpuKey(g.key);
      if (r.gpu.kind === 'dedicated' && r.gpu.vramGb) setVram(r.gpu.vramGb);
    }
    if (r.cpu) {
      const c = findCpuOption(r.cpu.tier);
      if (c) setCpuKey(c.key);
    }
    if (r.diskFree != null) setDisk(String(r.diskFree));
    setNote('Filled in from your pasted specs. Check them, then tap Save.');
  }

  async function save() {
    setError('');
    const diskNum = parseInt(disk, 10);
    setSaving(true);
    try {
      const row = await savePc(session.user.id, currentId, {
        name: name.trim() || 'My PC',
        pc_type: pcType,
        ram_gb: ram,
        gpu: gpuOption ? gpuOption.title : null,
        gpu_kind: gpuOption ? gpuOption.kind : null,
        gpu_tier: gpuOption ? gpuOption.tier : null,
        vram_gb: gpuOption && gpuOption.kind === 'dedicated' ? vram : null,
        cpu: cpuOption ? cpuOption.title : null,
        cpu_tier: cpuOption ? cpuOption.tier : null,
        disk_gb: diskNum > 0 ? diskNum : null,
      });
      setPcs((list) => {
        const exists = list.some((p) => p.id === row.id);
        const next = exists ? list.map((p) => (p.id === row.id ? row : p)) : [...list, row];
        return currentId ? next : next.map((p) => ({ ...p, is_active: p.id === row.id }));
      });
      setCurrentId(row.id);
      setNote('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(friendlySaveError(e));
    }
    setSaving(false);
  }

  function removePc() {
    confirmAction('Delete this PC?', `"${name || 'This PC'}" will be removed from My PC.`, 'Delete', async () => {
      try {
        await deletePc(currentId);
        const rest = pcs.filter((p) => p.id !== currentId);
        setPcs(rest);
        const next = rest.find((p) => p.is_active) || rest[0] || null;
        if (next && !next.is_active) {
          await setActivePc(session.user.id, next.id);
          setPcs(rest.map((p) => ({ ...p, is_active: p.id === next.id })));
        }
        fillForm(next, rest.length > 0);
      } catch (e) {
        setError(friendlySaveError(e));
      }
    });
  }

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };
  const small = { fontFamily: fonts.regular, fontSize: 12, color: t.muted, lineHeight: 17 };
  const isDraft = currentId === null;

  const pcChip = (key, label, on, onPress) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        height: 40, paddingHorizontal: 16, borderRadius: 20, justifyContent: 'center', borderWidth: 1,
        borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface,
      }}
    >
      <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 13, color: on ? t.onRed : t.text }}>{label}</Text>
    </Pressable>
  );

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
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text, marginBottom: 12 }}>
            Your library on {activePc ? activePc.name : 'this PC'}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {[['can', counts.can], ['might', counts.might], ['unknown', counts.unknown]].map(([k, n]) => (
              <View key={k} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>{n}</Text>
                <CompatBadge status={k} />
              </View>
            ))}
          </View>
          {(!activePc || activePc.gpu_tier == null) && (
            <Text style={[small, { marginTop: 12, textAlign: 'center' }]}>
              Save your specs, including your graphics, to see matches.
            </Text>
          )}
          {checking && <Text style={[small, { marginTop: 12, textAlign: 'center' }]}>Looking up game requirements…</Text>}
        </View>

        <View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 }}>Your PCs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {pcs.map((p) => pcChip(p.id, p.name, p.id === currentId, () => choosePc(p)))}
            {isDraft && pcs.length > 0 && pcChip('draft', name || 'New PC', true, () => {})}
            {!isDraft && pcChip('add', '+ Add PC', false, () => fillForm(null, true))}
            {isDraft && pcs.length === 0 && pcChip('first', name || 'My PC', true, () => {})}
          </ScrollView>
          {pcs.length > 1 && <Text style={[small, { marginTop: 6 }]}>Results across the app use the PC you pick here.</Text>}
        </View>

        <TextField label="PC name" value={name} onChangeText={setName} placeholder="e.g. Laptop" autoCapitalize="words" />

        <Pressable
          onPress={() => setPasteOpen(true)}
          accessibilityRole="button"
          style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>Paste my specs</Text>
            <Text style={[small, { marginTop: 2 }]}>Skip the picking: paste what Windows copies from Settings, System, About.</Text>
          </View>
          <Text style={{ color: t.muted, fontSize: 20 }}>›</Text>
        </Pressable>
        {!!note && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bold, fontSize: 13, color: t.text }}>{note}</Text>}

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
          value={gpuKey === 'unknown' ? "I'm not sure" : gpuOption ? gpuOption.title : ''}
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
        <Button title={saved ? 'Saved ✓' : isDraft ? 'Save this PC' : 'Save changes'} onPress={save} loading={saving} />
        {!isDraft && <Button title="Delete this PC" variant="secondary" onPress={removePc} />}

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

      <PasteSpecsSheet visible={pasteOpen} onClose={() => setPasteOpen(false)} onApply={applyPasted} />
    </KeyboardAvoidingView>
  );
}
