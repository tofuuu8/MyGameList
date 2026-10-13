import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GameCard from '../components/GameCard';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const FILTERS = ['All', 'Playing', 'Completed', 'Want to Play', 'Installed'];

function matches(game, filter) {
  switch (filter) {
    case 'Playing': return game.status === 'playing';
    case 'Completed': return game.status === 'completed';
    case 'Want to Play': return game.status === 'want_to_play';
    case 'Installed': return game.is_installed;
    default: return true;
  }
}

export default function LibraryScreen({ navigation }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else { setGames(data); setError(''); }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter(
      (g) => matches(g, filter) && (!q || g.title.toLowerCase().includes(q) || (g.genre || '').toLowerCase().includes(q))
    );
  }, [games, filter, query]);

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

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search your games"
        placeholderTextColor={t.muted}
        accessibilityLabel="Search your games"
        autoCorrect={false}
        style={{
          height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface,
          color: t.text, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 15, marginBottom: 12,
        }}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14 }}>
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
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
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, marginTop: 32, textAlign: 'center' }}>
        No games match your search or filter.
      </Text>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
      data={shown}
      keyExtractor={(g) => g.id}
      renderItem={({ item }) => (
        <GameCard game={item} onPress={() => navigation.getParent()?.navigate('GameDetail', { id: item.id })} />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} tintColor={t.red} onRefresh={() => { setRefreshing(true); load(); }} />
      }
    />
  );
}
