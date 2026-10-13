import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Game data comes from RAWG through a Supabase function named "rawg".
// The RAWG key is stored on the server, so it is never inside the app.
export const RAWG_ENABLED = true;
const TTL = 12 * 60 * 60 * 1000; // keep results on the phone for 12 hours

export async function rawgGet(path, params = {}) {
  const { data, error } = await supabase.functions.invoke('rawg', { body: { path, params } });
  if (error) throw error;
  return data;
}

function normalize(g) {
  return {
    id: g.id,
    name: g.name,
    cover: g.background_image || null,
    genre: g.genres?.[0]?.name || '',
    rating: g.rating || 0,
  };
}

// Fetch PC games. `params` are RAWG options (genres, ordering, dates, ...).
// Results are saved on the phone so Discover loads fast and makes fewer requests.
export async function fetchGames(params, { cache = true } = {}) {
  const all = { platforms: '4', ...params };
  const cacheKey = `rawg:${new URLSearchParams(all).toString()}`;

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
    const json = await rawgGet('/games', all);
    const data = (json.results || []).map(normalize);
    if (cache) AsyncStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })).catch(() => {});
    return data;
  } catch (e) {
    if (stale) return stale; // offline or rate-limited: show the older results
    throw e;
  }
}
