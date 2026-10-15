import { supabase } from './supabase';

// Asks the server (which holds the Steam key) for the games on a public Steam profile.
export async function fetchSteamLibrary(query) {
  const { data, error } = await supabase.functions.invoke('steam', { body: { query } });
  if (error) {
    let message = '';
    try {
      const body = await error.context.json();
      message = body && body.error ? body.error : '';
    } catch {
      // no readable message from the server
    }
    throw new Error(message || 'Could not reach Steam. Check your connection and try again.');
  }
  return data;
}

// Loads every game already in the library (the database returns 1000 rows at a time).
export async function loadExistingGames() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('games')
      .select('id,title,steam_appid,hours_played')
      .range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

const steamCover = (appid) => `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;

// Decides what to add and what to update, without touching the database.
//  - New games are added (games with no playtime only if includeUnplayed is on).
//  - Games already in the library are never duplicated. Their Steam id is remembered, and
//    their hours are raised if Steam shows more.
export function planImport(steamGames, existing, { includeUnplayed = true, playedStatus = 'playing' } = {}) {
  const byApp = new Map();
  const byTitle = new Map();
  existing.forEach((g) => {
    if (g.steam_appid) byApp.set(g.steam_appid, g);
    byTitle.set(String(g.title).trim().toLowerCase(), g);
  });

  const inserts = [];
  const updates = [];
  let skipped = 0;
  const seen = new Set();

  steamGames.forEach((s) => {
    if (seen.has(s.appid)) return;
    seen.add(s.appid);
    const hours = Math.round((s.minutes / 60) * 10) / 10;
    const match = byApp.get(s.appid) || byTitle.get(String(s.name).trim().toLowerCase());

    if (match) {
      const patch = {};
      if (!match.steam_appid) patch.steam_appid = s.appid;
      if (hours > Number(match.hours_played || 0)) patch.hours_played = hours;
      if (Object.keys(patch).length > 0) updates.push({ id: match.id, patch });
      else skipped += 1;
      return;
    }
    if (!includeUnplayed && hours === 0) {
      skipped += 1;
      return;
    }
    inserts.push({
      title: s.name,
      status: hours > 0 ? playedStatus : 'want_to_play',
      is_installed: false,
      hours_played: hours,
      steam_appid: s.appid,
      cover_url: steamCover(s.appid),
    });
  });

  return { inserts, updates, skipped };
}

// Saves the plan. `onProgress(done, total)` is called as it goes.
export async function runImport(plan, userId, onProgress = () => {}) {
  const total = plan.inserts.length + plan.updates.length;
  let done = 0;

  for (let i = 0; i < plan.inserts.length; i += 200) {
    const chunk = plan.inserts.slice(i, i + 200).map((g) => ({ ...g, user_id: userId }));
    const { error } = await supabase
      .from('games')
      .upsert(chunk, { onConflict: 'user_id,steam_appid', ignoreDuplicates: true });
    if (error) throw error;
    done += chunk.length;
    onProgress(done, total);
  }

  for (let i = 0; i < plan.updates.length; i += 10) {
    const chunk = plan.updates.slice(i, i + 10);
    const results = await Promise.all(chunk.map((u) => supabase.from('games').update(u.patch).eq('id', u.id)));
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
    done += chunk.length;
    onProgress(done, total);
  }
}
