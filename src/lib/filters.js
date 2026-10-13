import { checkCompat } from './compat';

export const DEFAULT_FILTERS = {
  sort: 'newest', // newest | title | hours | rating
  status: null, // null | playing | completed | want_to_play
  install: 'all', // all | installed | not_installed
  genre: null,
  minRating: 0, // 0 = any
  canRun: false,
};

// How many filters are switched on (sorting does not count).
export function activeFilterCount(f) {
  return (f.status ? 1 : 0) + (f.install !== 'all' ? 1 : 0) + (f.genre ? 1 : 0) + (f.minRating > 0 ? 1 : 0) + (f.canRun ? 1 : 0);
}

export function applyFilters(games, f, specs, query = '') {
  const q = query.trim().toLowerCase();
  const list = games.filter((g) => {
    if (q && !g.title.toLowerCase().includes(q) && !(g.genre || '').toLowerCase().includes(q)) return false;
    if (f.status && g.status !== f.status) return false;
    if (f.install === 'installed' && !g.is_installed) return false;
    if (f.install === 'not_installed' && g.is_installed) return false;
    if (f.genre && g.genre !== f.genre) return false;
    if (f.minRating > 0 && !(g.rating != null && Number(g.rating) >= f.minRating)) return false;
    if (f.canRun && checkCompat(g, specs).status !== 'can') return false;
    return true;
  });
  const sorters = {
    title: (a, b) => a.title.localeCompare(b.title),
    hours: (a, b) => Number(b.hours_played || 0) - Number(a.hours_played || 0),
    rating: (a, b) => (b.rating == null ? -1 : Number(b.rating)) - (a.rating == null ? -1 : Number(a.rating)),
  };
  const sorter = sorters[f.sort];
  return sorter ? [...list].sort(sorter) : list; // "newest" keeps the order from the database
}
