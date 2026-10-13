import { RAWG_ENABLED, rawgGet } from './rawg';
import { supabase } from './supabase';

// ---- Reading the requirement text that RAWG provides --------------------------------
// RAWG gives PC requirements as free text like:
//   "Minimum: OS: Windows 10 Processor: Intel Core i5 Memory: 8 GB RAM Graphics: GTX 970 Storage: 50 GB"
// so this is a best-effort reader. When it can't find a number, the result is "Unknown".
const LABELS = [
  'Video Memory', 'Video Card', 'Hard Drive', 'Hard Disk', 'Sound Card', 'Additional Notes',
  'Processor', 'Graphics', 'Storage', 'Memory', 'DirectX', 'Network', 'Disk', 'CPU', 'GPU', 'RAM', 'OS',
];
const SPLIT = new RegExp(`(${LABELS.join('|')})\\s*:`, 'i');
const AMOUNT = /(\d+(?:[.,]\d+)?)\s*(GB|MB|TB)/i;

function toGB(value, unit) {
  const n = parseFloat(String(value).replace(',', '.'));
  const u = unit.toUpperCase();
  if (u === 'MB') return n / 1024;
  if (u === 'TB') return n * 1024;
  return n;
}

function amount(text) {
  const m = text.match(AMOUNT);
  return m ? toGB(m[1], m[2]) : null;
}

export function parseRequirements(text) {
  const out = { ram: null, vram: null, disk: null, gpu: null, cpu: null };
  if (!text) return out;
  const minimum = text.split(/Recommended\s*:/i)[0].replace(/\s+/g, ' ');
  const parts = minimum.split(SPLIT);
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i].toLowerCase();
    const body = (parts[i + 1] || '').trim();
    if (label === 'memory' || label === 'ram') {
      if (out.ram == null) out.ram = amount(body);
    } else if (label === 'video memory') {
      if (out.vram == null) out.vram = amount(body);
    } else if (label === 'graphics' || label === 'video card' || label === 'gpu') {
      if (!out.gpu) out.gpu = body.slice(0, 80);
      const m = body.match(/(\d+(?:[.,]\d+)?)\s*(GB|MB)\s*(?:of\s*)?(?:dedicated\s*)?(?:VRAM|video|memory)/i);
      if (m && out.vram == null) out.vram = toGB(m[1], m[2]);
    } else if (['storage', 'hard drive', 'hard disk', 'disk'].includes(label)) {
      if (out.disk == null) out.disk = amount(body);
    } else if (label === 'processor' || label === 'cpu') {
      if (!out.cpu) out.cpu = body.slice(0, 80);
    }
  }
  return out;
}

const round1 = (n) => (n == null || !Number.isFinite(n) || n <= 0 || n > 2000 ? null : Math.round(n * 10) / 10);

// Looks up a game's minimum requirements once and saves them on the game row.
// Throws if the network fails, so the caller can try again later.
export async function ensureRequirements(game) {
  if (game.req_checked || !RAWG_ENABLED) return game;

  let id = game.rawg_id;
  if (!id) {
    // Older games have no RAWG id: accept a match only if the name is identical.
    const found = await rawgGet('/games', { search: game.title, page_size: 3 });
    const hit = (found.results || []).find(
      (g) => g.name.toLowerCase() === game.title.trim().toLowerCase()
    );
    id = hit ? hit.id : null;
  }

  let parsed = { ram: null, vram: null, disk: null, gpu: null, cpu: null };
  if (id) {
    const detail = await rawgGet(`/games/${id}`);
    const pc = (detail.platforms || []).find((p) => p.platform && p.platform.id === 4);
    parsed = parseRequirements((pc && pc.requirements && pc.requirements.minimum) || '');
  }

  const fields = {
    rawg_id: id,
    min_ram_gb: parsed.ram != null && parsed.ram > 0 && parsed.ram <= 512 ? Math.ceil(parsed.ram) : null,
    min_vram_gb: round1(parsed.vram),
    min_disk_gb: round1(parsed.disk),
    min_gpu: parsed.gpu,
    min_cpu: parsed.cpu,
    req_checked: true,
  };
  const { error } = await supabase.from('games').update(fields).eq('id', game.id);
  return error ? game : { ...game, ...fields };
}

// ---- Comparing a game with the user's PC ----------------------------------------------
// Uses RAM, graphics memory (VRAM) and free disk space only. These are plain numbers;
// comparing GPU and CPU models fairly would need a benchmark database.
export function checkCompat(game, specs) {
  const checks = [
    { label: 'RAM', need: game.min_ram_gb, have: specs ? specs.ram_gb : null },
    { label: 'graphics memory', need: game.min_vram_gb, have: specs ? specs.vram_gb : null },
    { label: 'free disk space', need: game.min_disk_gb, have: specs ? specs.disk_gb : null },
  ].filter((c) => c.need != null && c.have != null);

  if (checks.length === 0) return { status: 'unknown', reasons: [] };
  const fails = checks.filter((c) => Number(c.have) < Number(c.need));
  if (fails.length > 0) {
    return {
      status: 'might',
      reasons: fails.map((c) => `Needs ${Number(c.need)} GB ${c.label}; you have ${Number(c.have)} GB.`),
    };
  }
  return { status: 'can', reasons: [] };
}
