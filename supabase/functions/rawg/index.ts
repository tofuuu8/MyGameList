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

// Only these RAWG options can be sent through, so the proxy can't be used for anything else.
const ALLOWED_PARAMS = new Set([
  'search', 'page_size', 'page', 'ordering', 'dates', 'genres', 'tags', 'platforms',
]);

// Passes game searches to RAWG using a key that stays on the server (secret RAWG_API_KEY).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const key = Deno.env.get('RAWG_API_KEY');
  if (!key) return json({ error: 'The RAWG_API_KEY secret is not set on the server.' }, 500);

  let body: { path?: unknown; params?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const path = body.path;
  if (typeof path !== 'string' || !(path === '/games' || /^\/games\/\d+$/.test(path))) {
    return json({ error: 'Path not allowed' }, 400);
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(body.params ?? {})) {
    if (ALLOWED_PARAMS.has(k) && v !== null && v !== undefined) qs.set(k, String(v));
  }
  qs.set('key', key);

  try {
    const res = await fetch(`https://api.rawg.io/api${path}?${qs.toString()}`);
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch {
    return json({ error: 'Could not reach RAWG' }, 502);
  }
});
