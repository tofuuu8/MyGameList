const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

const STEAM = 'https://api.steampowered.com';
const COMMUNITY = 'https://steamcommunity.com';

type Game = { appid: number; name: string; minutes: number };

// A Steam API key is 32 letters and digits. Pick it out if extra text was pasted with it.
function cleanKey(raw: string): string {
  const match = raw.match(/[0-9a-f]{32}/i);
  return match ? match[0] : raw.trim();
}

// Works out which Steam account the person means from a profile link, a custom name or a 17-digit ID.
function parseInput(input: string): { steamId?: string; vanity?: string } | null {
  const q = input.trim();
  if (/^\d{17}$/.test(q)) return { steamId: q };
  const byId = q.match(/steamcommunity\.com\/profiles\/(\d{17})/i);
  if (byId) return { steamId: byId[1] };
  const byName = q.match(/steamcommunity\.com\/id\/([A-Za-z0-9_-]{2,64})/i);
  if (byName) return { vanity: byName[1] };
  if (/^[A-Za-z0-9_-]{2,64}$/.test(q)) return { vanity: q };
  return null;
}

const PRIVATE_MESSAGE =
  "We couldn't see any games. In Steam's Privacy Settings, set both My profile and Game details to Public, wait a few minutes, then try again.";

// While we are fixing Steam import, the error message ends with a short technical note.
const SHOW_DEBUG = true;

// ---------- Option 1: the official Steam API (only used when a STEAM_API_KEY secret exists) ----------
async function viaOfficialApi(key: string, parsed: { steamId?: string; vanity?: string }): Promise<Response> {
  let steamId = parsed.steamId;
  if (!steamId && parsed.vanity) {
    const res = await fetch(
      `${STEAM}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(parsed.vanity)}`,
    );
    if (!res.ok) {
      console.error(`Steam ResolveVanityURL answered ${res.status}`);
      return json({ error: 'Steam did not answer. Please try again in a moment.' }, 502);
    }
    const data = await res.json();
    if (data?.response?.success !== 1 || !data.response.steamid) {
      return json({ error: 'No Steam profile was found with that name. Check your custom name or use your profile link.' }, 404);
    }
    steamId = data.response.steamid;
  }
  const res = await fetch(
    `${STEAM}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`,
  );
  if (!res.ok) {
    console.error(`Steam GetOwnedGames answered ${res.status}`);
    return json({ error: 'Steam did not answer. Please try again in a moment.' }, 502);
  }
  const data = await res.json();
  const games = data?.response?.games;
  if (!Array.isArray(games) || games.length === 0) return json({ error: PRIVATE_MESSAGE }, 403);
  const list: Game[] = games
    .filter((g: { appid?: number; name?: string }) => g.appid && g.name)
    .map((g: { appid: number; name: string; playtime_forever?: number }) => ({
      appid: g.appid,
      name: g.name,
      minutes: g.playtime_forever ?? 0,
    }));
  return json({ steamId, count: list.length, games: list.slice(0, 5000) });
}

// ---------- Option 2: the public Steam Community pages (no key needed) ----------
// Unofficial: it reads the same page a person sees at steamcommunity.com/id/NAME/games.
// It only works when the profile's Game details are Public, and Steam may change the page.
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const decodeEntities = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Finds the [...] that starts at `start` and returns it, respecting quotes inside strings.
function extractArray(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function minutesOf(g: Record<string, unknown>): number {
  if (typeof g.playtime_forever === 'number') return g.playtime_forever;
  const hours = parseFloat(String(g.hours_forever ?? '0').replace(/,/g, ''));
  return Number.isFinite(hours) ? Math.round(hours * 60) : 0;
}

function fromRawList(list: unknown): Game[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((g) => g && typeof g === 'object' && Number((g as { appid?: unknown }).appid) > 0 && (g as { name?: unknown }).name)
    .map((g) => {
      const r = g as Record<string, unknown>;
      return { appid: Number(r.appid), name: String(r.name), minutes: minutesOf(r) };
    });
}

// Looks through any JSON for lists of objects that have an appid and a name.
function findGameLists(value: unknown, out: Game[] = [], depth = 0): Game[] {
  if (depth > 6 || value === null || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    const games = fromRawList(value);
    if (games.length > 0 && games.length >= value.length * 0.5) {
      out.push(...games);
      return out;
    }
    for (const v of value) findGameLists(v, out, depth + 1);
    return out;
  }
  for (const v of Object.values(value as Record<string, unknown>)) findGameLists(v, out, depth + 1);
  return out;
}

function parseGamesPage(html: string): Game[] {
  // Layout 1 (older): a script line "var rgGames = [...]".
  const i = html.indexOf('var rgGames');
  if (i !== -1) {
    const open = html.indexOf('[', i);
    const raw = open === -1 ? null : extractArray(html, open);
    if (raw) {
      try {
        const games = fromRawList(JSON.parse(raw));
        if (games.length) return games;
      } catch { /* try the next layout */ }
    }
  }
  // Layout 2 (newer): the lists are inside a data attribute as escaped JSON.
  const attr = html.match(/data-profile-gameslist=(["'])([\s\S]*?)\1/);
  if (attr) {
    try {
      const games = findGameLists(JSON.parse(decodeEntities(attr[2])));
      if (games.length) return games;
    } catch { /* try the next layout */ }
  }
  // Layout 3: any game-like objects written anywhere in the page.
  const flat = decodeEntities(html);
  const found: Game[] = [];
  let count = 0;
  for (const m of flat.matchAll(/\{[^{}]*"appid"\s*:\s*\d+[^{}]*\}/g)) {
    if (++count > 20000) break;
    try {
      found.push(...fromRawList([JSON.parse(m[0])]));
    } catch { /* skip pieces that are not valid JSON */ }
  }
  return found;
}

function parseGamesXml(xml: string): Game[] {
  const games: Game[] = [];
  for (const block of xml.matchAll(/<game>([\s\S]*?)<\/game>/g)) {
    const id = block[1].match(/<appID>(\d+)<\/appID>/);
    const name = block[1].match(/<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/);
    const hours = block[1].match(/<hoursOnRecord>([\d.,]+)<\/hoursOnRecord>/);
    if (id && name) {
      const h = hours ? parseFloat(hours[1].replace(/,/g, '')) : 0;
      games.push({ appid: Number(id[1]), name: decodeEntities(name[1].trim()), minutes: Math.round((Number.isFinite(h) ? h : 0) * 60) });
    }
  }
  return games;
}

async function viaCommunityPages(parsed: { steamId?: string; vanity?: string }): Promise<Response> {
  const base = parsed.steamId
    ? `${COMMUNITY}/profiles/${parsed.steamId}`
    : `${COMMUNITY}/id/${encodeURIComponent(parsed.vanity ?? '')}`;

  const page = await fetch(`${base}/games/?tab=all&l=english`, { headers: HEADERS });
  const html = await page.text();

  if (page.status === 404 || /The specified profile could not be found/i.test(html)) {
    return json({ error: 'No Steam profile was found with that name. Check your custom name or use your profile link.' }, 404);
  }

  let games = parseGamesPage(html);

  if (games.length === 0) {
    // Older XML list of the same page.
    const xmlRes = await fetch(`${base}/games/?tab=all&xml=1`, { headers: HEADERS });
    games = parseGamesXml(await xmlRes.text());
  }

  if (games.length === 0) {
    // Find out WHY there are no games: ask for the profile's public details.
    let privacy = 'unknown';
    try {
      const profile = await (await fetch(`${base}/?xml=1`, { headers: HEADERS })).text();
      privacy = profile.match(/<privacyState>(\w+)<\/privacyState>/i)?.[1]?.toLowerCase() ?? 'unknown';
    } catch { /* leave as unknown */ }

    const title = (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').trim().slice(0, 60);
    const debug =
      `status ${page.status}, ${html.length} bytes, title "${title}", rgGames:${html.includes('rgGames')}, ` +
      `attr:${html.includes('data-profile-gameslist')}, appid:${html.includes('appid')}, privacy:${privacy}`;
    console.error(`Community page gave no games: ${debug}`);

    let message = PRIVATE_MESSAGE;
    if (privacy === 'friendsonly' || privacy === 'private') {
      message =
        'Your Steam profile is set to Friends Only or Private. In Steam\'s Privacy Settings, set both My profile and Game details to Public, wait a few minutes, then try again.';
    } else if (privacy === 'public') {
      message =
        'Your profile is public, but we still could not read your games. Check that Game details is set to Public (changes can take a few minutes), then try again.';
    }
    return json({ error: SHOW_DEBUG ? `${message} [${debug}]` : message }, 403);
  }

  const seen = new Set<number>();
  const unique = games.filter((g) => (seen.has(g.appid) ? false : (seen.add(g.appid), true)));
  return json({ steamId: parsed.steamId ?? null, count: unique.length, games: unique.slice(0, 5000) });
}

// Looks up the games on a public Steam profile. Uses the official API when a STEAM_API_KEY secret
// is set, and the public Steam Community pages otherwise. Only the signed-in app can call it.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let query = '';
  try {
    const body = await req.json();
    query = typeof body.query === 'string' ? body.query.slice(0, 200) : '';
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const parsed = parseInput(query);
  if (!parsed) {
    return json({ error: 'Enter your Steam profile link, your Steam custom name, or your 17-digit Steam ID.' }, 400);
  }

  try {
    const key = cleanKey(Deno.env.get('STEAM_API_KEY') ?? '');
    return key ? await viaOfficialApi(key, parsed) : await viaCommunityPages(parsed);
  } catch (e) {
    console.error(`Steam lookup failed: ${String(e)}`);
    return json({ error: 'Could not reach Steam. Please try again in a moment.' }, 502);
  }
});
