import AsyncStorage from '@react-native-async-storage/async-storage';
import { rawgGet } from './rawg';

const TTL = 7 * 24 * 60 * 60 * 1000; // keep game details on the phone for a week

const sameName = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

// Details for the "About this game" card: release date, description, screenshots.
// Uses the game's RAWG id when it has one, otherwise finds the game by its exact name.
export async function loadGameInfo(game) {
  const cacheKey = `rawg-info:${game.rawg_id || String(game.title).toLowerCase()}`;
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Date.now() - saved.t < TTL) return saved.data;
    }
  } catch {
    // ignore cache problems
  }

  let id = game.rawg_id || null;
  let match = null;
  const search = await rawgGet('/games', { search: id ? undefined : game.title, page_size: 5 }).catch(() => null);
  if (!id && search && search.results) {
    match = search.results.find((g) => sameName(g.name, game.title)) || null;
    id = match ? match.id : null;
  }
  if (!id) return null;

  const details = await rawgGet(`/games/${id}`);

  // Screenshots come with search results, so look the game up by its RAWG name once more if needed.
  if (!match || !match.short_screenshots) {
    const again = await rawgGet('/games', { search: details.name, page_size: 5 }).catch(() => null);
    match = again && again.results ? again.results.find((g) => g.id === id) || null : null;
  }

  const shots = [
    ...(match && match.short_screenshots ? match.short_screenshots.map((s) => s.image) : []),
    details.background_image,
    details.background_image_additional,
  ].filter(Boolean);

  const data = {
    id,
    released: details.released || null,
    description: (details.description_raw || '').trim(),
    developers: (details.developers || []).map((d) => d.name).slice(0, 3),
    genres: (details.genres || []).map((g) => g.name).slice(0, 4),
    metacritic: details.metacritic || null,
    website: details.website || null,
    screenshots: [...new Set(shots)].slice(0, 8),
  };
  AsyncStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })).catch(() => {});
  return data;
}
