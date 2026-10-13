import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from './Button';
import { DEFAULT_FILTERS, applyFilters } from '../lib/filters';
import { fonts, useTheme } from '../theme';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'title', label: 'Title A–Z' },
  { key: 'hours', label: 'Most hours' },
  { key: 'rating', label: 'Top rated' },
];
const STATUSES = [
  { key: 'playing', label: 'Playing' },
  { key: 'completed', label: 'Completed' },
  { key: 'want_to_play', label: 'Want to Play' },
];
const INSTALLS = [
  { key: 'all', label: 'All' },
  { key: 'installed', label: 'Installed' },
  { key: 'not_installed', label: 'Not installed' },
];
const RATINGS = [
  { key: 0, label: 'Any' },
  { key: 3, label: '3+ ★' },
  { key: 4, label: '4+ ★' },
  { key: 5, label: '5 ★' },
];

function Chip({ label, on, onPress, grow, t }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{
        flex: grow ? 1 : undefined, height: 36, paddingHorizontal: grow ? 0 : 14, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center', borderWidth: 1,
        borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface,
      }}
    >
      <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: grow ? 12 : 13, color: on ? t.onRed : t.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Group({ label, t, children, wrap }) {
  return (
    <View>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: wrap ? 'wrap' : 'nowrap' }}>{children}</View>
    </View>
  );
}

export default function FilterSheet({ visible, onClose, filters, onApply, games, specs, query }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);

  // Start from the current filters each time the sheet opens.
  useEffect(() => { if (visible) setDraft(filters); }, [visible, filters]);

  const genres = useMemo(() => {
    const counts = {};
    games.forEach((g) => { if (g.genre) counts[g.genre] = (counts[g.genre] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
  }, [games]);

  const count = useMemo(() => applyFilters(games, draft, specs, query).length, [games, draft, specs, query]);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          accessibilityLabel="Close filters"
          style={[StyleSheet.absoluteFill, { backgroundColor: t.dim }]}
        />
        <View
          style={{
            backgroundColor: t.sheet, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1,
            borderColor: t.border, maxHeight: '90%', paddingTop: 10, paddingHorizontal: 20, paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, alignSelf: 'center' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 20, color: t.text }}>
              Filter and sort
            </Text>
            <Pressable
              onPress={() => setDraft(DEFAULT_FILTERS)}
              accessibilityRole="button"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.link }}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
            <Group label="Sort by" t={t}>
              {SORTS.map((o) => (
                <Chip key={o.key} grow t={t} label={o.label} on={draft.sort === o.key} onPress={() => set({ sort: o.key })} />
              ))}
            </Group>
            <Group label="Play status" t={t}>
              {STATUSES.map((o) => (
                <Chip key={o.key} grow t={t} label={o.label} on={draft.status === o.key} onPress={() => set({ status: draft.status === o.key ? null : o.key })} />
              ))}
            </Group>
            <Group label="Install status" t={t}>
              {INSTALLS.map((o) => (
                <Chip key={o.key} grow t={t} label={o.label} on={draft.install === o.key} onPress={() => set({ install: o.key })} />
              ))}
            </Group>
            {genres.length > 0 && (
              <Group label="Genre" t={t} wrap>
                {genres.map((g) => (
                  <Chip key={g} t={t} label={g} on={draft.genre === g} onPress={() => set({ genre: draft.genre === g ? null : g })} />
                ))}
              </Group>
            )}
            <Group label="Minimum rating" t={t}>
              {RATINGS.map((o) => (
                <Chip key={o.key} grow t={t} label={o.label} on={draft.minRating === o.key} onPress={() => set({ minRating: o.key })} />
              ))}
            </Group>
            <View
              style={{
                backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14,
                paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 }}>
                <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.text }}>Only games my PC can run</Text>
                <Switch
                  value={draft.canRun}
                  onValueChange={(v) => set({ canRun: v })}
                  accessibilityLabel="Only games my PC can run"
                  trackColor={{ false: t.border, true: t.red }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {!specs && (
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, paddingBottom: 4 }}>
                  Save your PC in the My PC tab first.
                </Text>
              )}
            </View>
          </ScrollView>

          <Button
            title={`Show ${count} ${count === 1 ? 'game' : 'games'}`}
            onPress={() => { onApply(draft); onClose(); }}
          />
        </View>
      </View>
    </Modal>
  );
}
