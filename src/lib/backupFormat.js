import { STATUS_KEYS, STATUS_LABEL } from './status';

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// A spreadsheet (opens in Excel or Google Sheets).
export function toCsv(games) {
  const head = ['Title', 'Genre', 'Status', 'Installed', 'Rating', 'Hours played', 'Goal hours', 'Notes', 'Date added'];
  const rows = games.map((g) => [
    g.title, g.genre, STATUS_LABEL[g.status] || g.status, g.is_installed ? 'Yes' : 'No', g.rating,
    g.hours_played, g.goal_hours, g.notes, g.created_at ? String(g.created_at).slice(0, 10) : '',
  ]);
  return '\uFEFF' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

// A full backup that can be restored later.
export function toBackupJson(games) {
  return JSON.stringify(
    {
      app: 'MyGameList',
      version: 1,
      exportedAt: new Date().toISOString(),
      games: games.map((g) => ({
        title: g.title, genre: g.genre, cover_url: g.cover_url, status: g.status, is_installed: g.is_installed,
        rating: g.rating, hours_played: g.hours_played, goal_hours: g.goal_hours, notes: g.notes,
        steam_appid: g.steam_appid, rawg_id: g.rawg_id, created_at: g.created_at,
      })),
    },
    null,
    2
  );
}

const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// Reads a backup file and turns it into clean rows. Throws a readable error for a wrong file.
export function parseBackup(raw) {
  let data;
  try {
    data = JSON.parse(String(raw).replace(/^\uFEFF/, ''));
  } catch {
    throw new Error('That file is not a MyGameList backup.');
  }
  if (!data || data.app !== 'MyGameList' || !Array.isArray(data.games)) {
    throw new Error('That file is not a MyGameList backup.');
  }
  const rows = [];
  data.games.forEach((g) => {
    const title = text(g && g.title, 200);
    if (!title) return;
    const rating = num(g.rating, 0, 5);
    const hours = num(g.hours_played, 0, 99999);
    const goal = num(g.goal_hours, 0.1, 99999);
    const appid = Number.isInteger(g.steam_appid) ? g.steam_appid : null;
    const rawgId = Number.isInteger(g.rawg_id) ? g.rawg_id : null;
    rows.push({
      title,
      genre: text(g.genre, 80),
      cover_url: typeof g.cover_url === 'string' && /^https?:\/\//.test(g.cover_url) ? g.cover_url : null,
      status: STATUS_KEYS.includes(g.status) ? g.status : 'want_to_play',
      is_installed: g.is_installed === true,
      rating,
      hours_played: hours == null ? 0 : Math.round(hours * 10) / 10,
      goal_hours: goal == null ? null : Math.round(goal * 10) / 10,
      notes: text(g.notes, 5000),
      steam_appid: appid,
      rawg_id: rawgId,
    });
  });
  return rows;
}

// Removes games that are already in the library (same Steam id or same title).
export function onlyNewGames(rows, existing) {
  const titles = new Set(existing.map((g) => String(g.title).trim().toLowerCase()));
  const apps = new Set(existing.filter((g) => g.steam_appid).map((g) => g.steam_appid));
  const seen = new Set();
  return rows.filter((r) => {
    const key = r.title.toLowerCase();
    if (titles.has(key) || seen.has(key) || (r.steam_appid && apps.has(r.steam_appid))) return false;
    seen.add(key);
    return true;
  });
}
