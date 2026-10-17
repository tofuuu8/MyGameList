import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { RAWG_ENABLED, fetchGames } from '../lib/rawg';
import { fetchAllGames } from '../lib/paged';
import { fetchRecommendations, topGenres } from '../lib/recommend';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/dialog';
import { fonts, useTheme } from '../theme';

const GENRES = [
  { label: 'Trending', params: {} },
  { label: 'Action', params: { genres: 'action' } },
  { label: 'RPG', params: { genres: 'role-playing-games-rpg' } },
  { label: 'Strategy', params: { genres: 'strategy' } },
  { label: 'Indie', params: { genres: 'indie' } },
  { label: 'Horror', params: { tags: 'horror' } },
];
const COVER_COLORS = ['#8A1620', '#B01E2B', '#4A4A4A', '#6B1018', '#2F2F2F', '#7A1A24'];

const isoDate = (d) => d.toISOString().slice(0, 10);

function Cover({ game, width, height, radius }) {
  const hash = [...game.name].reduce((n, c) => n + c.charCodeAt(0), 0);
  if (game.cover) return <Image source={{ uri: game.cover }} style={{ width, height, borderRadius: radius }} />;
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: COVER_COLORS[hash % COVER_COLORS.length], alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: '#FFFFFF' }}>{game.name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export default function DiscoverScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [genre, setGenre] = useState(GENRES[0]);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [owned, setOwned] = useState(new Set());
  const [library, setLibrary] = useState([]);
  const [recs, setRecs] = useState([]);
  const [adding, setAdding] = useState(new Set());
  const reqId = useRef(0);

  // Which games are already in the user's library (to show "In library").
  useFocusEffect(
    useCallback(() => {
      fetchAllGames('title,genre,status,rating,hours_played')
        .then((rows) => {
          setOwned(new Set(rows.map((g) => g.title.toLowerCase())));
          setLibrary(rows);
        })
        .catch(() => {});
    }, [])
  );

  // Trending (recent, popular) and popular-of-all-time lists for the chosen genre.
  useEffect(() => {
    if (!RAWG_ENABLED) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPage(1);
    const end = new Date();
    const start = new Date(end.getTime() - 365 * 86400000);
    Promise.all([
      fetchGames({ ...genre.params, dates: `${isoDate(start)},${isoDate(end)}`, ordering: '-added', page_size: '8' }),
      fetchGames({ ...genre.params, ordering: '-added', page_size: '10' }),
    ])
      .then(([a, b]) => { if (!cancelled) { setTrending(a); setPopular(b); } })
      .catch(() => { if (!cancelled) setError('Could not load games. Check your connection and try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [genre, reloadKey]);

  // "Because you play ...": popular games in the genres you play most, minus the ones you own.
  useEffect(() => {
    const top = topGenres(library, 2);
    if (top.length === 0) { setRecs([]); return undefined; }
    let cancelled = false;
    const have = new Set(library.map((g) => g.title.toLowerCase()));
    Promise.all(
      top.map((name) =>
        fetchRecommendations(name, have).then((items) => ({ genre: name, items })).catch(() => ({ genre: name, items: [] }))
      )
    ).then((all) => { if (!cancelled) setRecs(all.filter((r) => r.items.length > 0)); });
    return () => { cancelled = true; };
  }, [library]);

  // Search all games as the user types.
  useEffect(() => {
    const q = query.trim();
    if (!RAWG_ENABLED || q.length < 2) { setResults([]); setSearching(false); return undefined; }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await fetchGames({ search: q, page_size: '12' }, { cache: false });
        if (id === reqId.current) setResults(data);
      } catch {
        if (id === reqId.current) setResults([]);
      } finally {
        if (id === reqId.current) setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  async function showMore() {
    setLoadingMore(true);
    try {
      const next = await fetchGames({ ...genre.params, ordering: '-added', page_size: '10', page: String(page + 1) });
      setPopular((prev) => [...prev, ...next.filter((g) => !prev.some((p) => p.id === g.id))]);
      setPage(page + 1);
    } catch {
      notify('Could not load more games', 'Check your connection and try again.');
    }
    setLoadingMore(false);
  }

  async function add(game) {
    const key = game.name.toLowerCase();
    if (owned.has(key) || adding.has(game.id)) return;
    setAdding((s) => new Set(s).add(game.id));
    const { error: err } = await supabase.from('games').insert({
      title: game.name, genre: game.genre || null, cover_url: game.cover, status: 'want_to_play', rawg_id: game.id,
    });
    setAdding((s) => { const n = new Set(s); n.delete(game.id); return n; });
    if (err) { notify('Could not add game', err.message); return; }
    setOwned((s) => new Set(s).add(key));
  }

  function addButton(game, full) {
    const isOwned = owned.has(game.name.toLowerCase());
    const busy = adding.has(game.id);
    const base = { height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, alignSelf: full ? 'stretch' : 'auto' };
    if (isOwned) {
      return (
        <View accessibilityLabel={`${game.name} is in your library`} style={[base, { borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }]}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>✓ In library</Text>
        </View>
      );
    }
    return (
      <Pressable
        onPress={() => add(game)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Add ${game.name} to library`}
        style={[base, { backgroundColor: t.red, opacity: busy ? 0.7 : 1 }]}
      >
        {busy ? <ActivityIndicator color={t.onRed} size="small" /> : (
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: t.onRed }}>+ Add</Text>
        )}
      </Pressable>
    );
  }

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };

  function renderRow(game) {
    return (
      <View style={[card, { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 }]}>
        <Cover game={game} width={56} height={72} radius={10} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>{game.name}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, marginTop: 3 }}>
            {[game.genre, game.rating ? `${game.rating.toFixed(1)} ★` : ''].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {addButton(game)}
      </View>
    );
  }

  const searchMode = query.trim().length >= 2;
  const heading = { fontFamily: fonts.bold, fontSize: 17, color: t.text };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, gap: 14 }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>Discover</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>Find your next game.</Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2} strokeLinecap="round" style={{ position: 'absolute', left: 34, top: 12, zIndex: 1 }}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="M20 20l-3.5-3.5" />
        </Svg>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search all games"
          placeholderTextColor={t.muted}
          accessibilityLabel="Search all games"
          autoCorrect={false}
          style={{ height: 44, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, color: t.text, paddingLeft: 42, paddingRight: 14, fontFamily: fonts.regular, fontSize: 15 }}
        />
      </View>

      {RAWG_ENABLED && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {GENRES.map((g) => {
            const on = g.label === genre.label;
            return (
              <Pressable
                key={g.label}
                onPress={() => setGenre(g)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', borderWidth: 1, borderColor: on ? t.red : t.border, backgroundColor: on ? t.red : t.surface }}
              >
                <Text style={{ fontFamily: on ? fonts.bold : fonts.regular, fontSize: 13, color: on ? t.onRed : t.text }}>{g.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {RAWG_ENABLED && searchMode && (
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <Text style={heading}>Results</Text>
          {searching && <ActivityIndicator color={t.red} style={{ marginTop: 12 }} />}
          {!searching && results.length === 0 && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted }}>No games found. Try a different name.</Text>
          )}
          {results.map((g) => <View key={g.id}>{renderRow(g)}</View>)}
        </View>
      )}

      {RAWG_ENABLED && !searchMode && loading && <ActivityIndicator color={t.red} style={{ marginTop: 32 }} />}

      {RAWG_ENABLED && !searchMode && !loading && !!error && (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.link }}>{error}</Text>
          <Button title="Try again" variant="secondary" onPress={() => setReloadKey((k) => k + 1)} />
        </View>
      )}

      {RAWG_ENABLED && !searchMode && !loading && !error && (
        <>
          <Text style={[heading, { paddingHorizontal: 20 }]}>Trending now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
            {trending.map((g) => (
              <View key={g.id} style={[card, { width: 150, padding: 8, gap: 6 }]}>
                <Cover game={g} width={132} height={104} radius={10} />
                <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>{g.name}</Text>
                <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{g.genre || ' '}</Text>
                {addButton(g, true)}
              </View>
            ))}
          </ScrollView>

          {genre.label === 'Trending' && recs.map((r) => (
            <View key={r.genre} style={{ gap: 14 }}>
              <Text style={[heading, { paddingHorizontal: 20 }]}>Because you play {r.genre}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
                {r.items.map((g) => (
                  <View key={g.id} style={[card, { width: 150, padding: 8, gap: 6 }]}>
                    <Cover game={g} width={132} height={104} radius={10} />
                    <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>{g.name}</Text>
                    <Text numberOfLines={1} style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{g.genre || ' '}</Text>
                    {addButton(g, true)}
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}

          <Text style={[heading, { paddingHorizontal: 20 }]}>
            {genre.label === 'Trending' ? 'Popular of all time' : `Popular in ${genre.label}`}
          </Text>
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {popular.map((g) => <View key={g.id}>{renderRow(g)}</View>)}
            <Button title="Show more" variant="secondary" loading={loadingMore} onPress={showMore} />
          </View>
        </>
      )}

      {RAWG_ENABLED && (
        <Pressable onPress={() => Linking.openURL('https://rawg.io')} accessibilityRole="link" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>Game data from RAWG</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
