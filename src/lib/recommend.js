import { fetchGames } from './rawg';

// RAWG genre names and spellings people type, mapped to RAWG's genre ids.
const SLUGS = {
  action: 'action', indie: 'indie', adventure: 'adventure', strategy: 'strategy', shooter: 'shooter',
  casual: 'casual', simulation: 'simulation', puzzle: 'puzzle', arcade: 'arcade', platformer: 'platformer',
  racing: 'racing', sports: 'sports', fighting: 'fighting', family: 'family', educational: 'educational',
  card: 'card', 'board games': 'board-games', 'massively multiplayer': 'massively-multiplayer',
  rpg: 'role-playing-games-rpg', 'role-playing': 'role-playing-games-rpg', 'role playing': 'role-playing-games-rpg',
  'role-playing (rpg)': 'role-playing-games-rpg', 'role-playing games': 'role-playing-games-rpg',
};

// Search options for a genre name. Genres RAWG doesn't list (like "Metroidvania") are tried as tags.
export function genreParams(name) {
  const key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  if (SLUGS[key]) return { genres: SLUGS[key] };
  const tag = key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return tag ? { tags: tag } : null;
}

// The genres a person plays most: games they finished, rated well or spent hours on count more.
// Games they dropped do not count.
export function topGenres(games, limit = 2) {
  const score = {};
  games.forEach((g) => {
    if (!g.genre || g.status === 'dropped') return;
    let points = 1;
    if (g.status === 'completed') points += 1;
    if (g.rating != null && Number(g.rating) >= 4) points += 1;
    points += Math.min(Number(g.hours_played || 0) / 20, 2);
    score[g.genre] = (score[g.genre] || 0) + points;
  });
  return Object.entries(score)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

// Popular games in a genre that the person doesn't own yet, best rated first.
export async function fetchRecommendations(genreName, ownedTitles) {
  const params = genreParams(genreName);
  if (!params) return [];
  const list = await fetchGames({ ...params, ordering: '-added', page_size: '20' });
  return list
    .filter((g) => !ownedTitles.has(g.name.toLowerCase()))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
}
