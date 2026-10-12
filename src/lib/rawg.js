import AsyncStorage from '@react-native-async-storage/async-storage';

export const RAWG_KEY = process.env.EXPO_PUBLIC_RAWG_KEY;
const TTL = 12 * 60 * 60 * 1000; // keep results on the phone for 12 hours

function normalize(g) {
  return {
    id: g.id,
    name: g.name,
    cover: g.background_image || null,
    genre: g.genres?.[0]?.name || '',
    rating: g.rating || 0,
  };
}

// Fetch PC games from RAWG. `params` are RAWG query options (genres, ordering, dates, ...).
// Results are saved on the phone so Discover loads fast and uses fewer requests.
export async function fetchGames(params, { cache = true } = {}) {
  const base = new URLSearchParams({ platforms: '4', ...params }).toString();
  const cacheKey = `rawg:${base}`;

  let stale = null;
  if (cache) {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Date.now() - saved.t < TTL) return saved.data;
        stale = saved.data;
      }
    } catch {
      // ignore cache read problems
    }
  }

  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&${base}`);
    if (!res.ok) throw new Error(`RAWG ${res.status}`);
    const json = await res.json();
    const data = (json.results || []).map(normalize);
    if (cache) AsyncStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })).catch(() => {});
    return data;
  } catch (e) {
    if (stale) return stale; // offline or rate-limited: show the older results
    throw e;
  }
}
