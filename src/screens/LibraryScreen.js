import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FilterSheet from '../components/FilterSheet';
import GameCard from '../components/GameCard';
import Svg, { Circle, Path } from 'react-native-svg';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { checkCompat } from '../lib/compat';
import { DEFAULT_FILTERS, activeFilterCount, applyFilters } from '../lib/filters';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const QUICK = ['All', 'Playing', 'Completed', 'Want to Play', 'Installed'];

export default function LibraryScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [games, setGames] = useState([]);
  const [specs, setSpecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else { setGames(data); setError(''); }
    const { data: pc } = await supabase.from('pc_specs').select('*').maybeSingle();
    setSpecs(pc || null);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shown = useMemo(() => applyFilters(games, filters, specs, query), [games, filters, specs, query]);
  const activeCount = activeFilterCount(filters);

  function quickOn(name) {
    if (name === 'All') return !filters.status && filters.install === 'all';
    if (name === 'Installed') return filters.install === 'installed';
    return filters.status === { Playing: 'playing', Completed: 'completed', 'Want to Play': 'want_to_play' }[name];
  }

  function pickQuick(name) {
    setFilters((f) => {
      if (name === 'All') return { ...f, status: null, install: 'all' };
      if (name === 'Installed') return { ...f, install: f.install === 'installed' ? 'all' : 'installed' };
      const key = { Playing: 'playing', Completed: 'completed', 'Want to Play': 'want_to_play' }[name];
      return { ...f, status: f.status === key ? null : key };
    });
  }

  const initial = (session?.user?.user_metadata?.username || session?.user?.email || '?').charAt(0).toUpperCase();

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: insets.top + 16, paddingBottom: 12 }}>
        <View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>MyGameList</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>
            {games.length} {games.length === 1 ? 'game' : 'games'} in your library
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('Profile')}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.onRed }}>{initial}</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your games"
          placeholderTextColor={t.muted}
          accessibilityLabel="Search your games"
          autoCorrect={false}
          style={{
            flex: 1, minWidth: 0, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
            color: t.text, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15,
          }}
        />
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={activeCount > 0 ? `Filter and sort, ${activeCount} on` : 'Filter and sort'}
          style={{ width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={t.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 7h8M18 7h2M4 17h2M12 17h8" />
            <Circle cx="15" cy="7" r="2.2" />
            <Circle cx="9" cy="17" r="2.2" />
          </Svg>
          {activeCount > 0 && (
            <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: t.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: t.onRed }}>{activeCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
        {QUICK.map((f) => {
          const on = quickOn(f);
          return (
            <Pressable
              key={f}
              onPress={() => pickQuick(f)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{
                height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', borderWidth: 1,
                borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface,
              }}
            >
              <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 13, color: on ? t.onRed : t.text }}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  let empty = null;
  if (loading) {
    empty = <ActivityIndicator color={t.red} style={{ marginTop: 48 }} />;
  } else if (error) {
    empty = (
      <View style={{ marginTop: 32, gap: 12 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.link }}>{error}</Text>
        <Button title="Try again" variant="secondary" onPress={load} />
      </View>
    );
  } else if (games.length === 0) {
    empty = (
      <View style={{ marginTop: 40, gap: 12 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: t.text }}>Your library is empty</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, lineHeight: 20 }}>
          Add your first game from the Add tab, or find one in Discover.
        </Text>
      </View>
    );
  } else {
    empty = (
      <View style={{ marginTop: 32, gap: 12 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, textAlign: 'center' }}>
          No games match your search or filters.
        </Text>
        <Button title="Clear filters" variant="secondary" onPress={() => { setFilters(DEFAULT_FILTERS); setQuery(''); }} />
      </View>
    );
  }

  return (
    <>
    <FlatList
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
      data={shown}
      extraData={[specs, filters]}
      keyExtractor={(g) => g.id}
      renderItem={({ item }) => (
        <GameCard game={item} compat={checkCompat(item, specs).status} onPress={() => navigation.getParent()?.navigate('GameDetail', { id: item.id })} />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} tintColor={t.red} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    />
    <FilterSheet
      visible={sheetOpen}
      onClose={() => setSheetOpen(false)}
      filters={filters}
      onApply={setFilters}
      games={games}
      specs={specs}
      query={query}
    />
    </>
  );
}
