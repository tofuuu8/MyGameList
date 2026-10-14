// Choices for the My PC screen, and a rough way to rate the graphics cards and
// processors named in a game's requirements. Everything here is an ESTIMATE:
// tiers are broad groups (1 = weakest), not exact benchmark scores.

export const GPU_OPTIONS = [
  { key: 'igpu-1', kind: 'integrated', tier: 1, title: 'Basic integrated graphics',
    detail: 'Intel HD / UHD Graphics, AMD "Radeon Graphics" on Ryzen 3/5 U-series chips (such as Radeon 610M), Vega 3 to 6' },
  { key: 'igpu-2', kind: 'integrated', tier: 2, title: 'Better integrated graphics',
    detail: 'Intel Iris Xe, AMD Vega 7 / 8, Radeon 660M' },
  { key: 'igpu-3', kind: 'integrated', tier: 3, title: 'Strong integrated graphics',
    detail: 'AMD Radeon 680M / 780M / 880M / 890M, Intel Arc graphics in Core Ultra chips' },
  { key: 'gpu-2', kind: 'dedicated', tier: 2, title: 'Older entry graphics card',
    detail: 'GeForce GT 710 / 730 / 1030, GTX 650 / 750, Radeon R7 250, RX 550' },
  { key: 'gpu-3', kind: 'dedicated', tier: 3, title: 'Entry graphics card',
    detail: 'GTX 960 / 1050 / 1050 Ti, GeForce MX450 / MX550, Radeon RX 460 / 560' },
  { key: 'gpu-4', kind: 'dedicated', tier: 4, title: 'Mid-range graphics card',
    detail: 'GTX 970 / 1060 / 1650 / 1660, RTX 2050, Radeon RX 470 / 480 / 570 / 580, RX 6400 / 6500' },
  { key: 'gpu-5', kind: 'dedicated', tier: 5, title: 'Good graphics card',
    detail: 'GTX 1070 / 1660 Ti, RTX 2060 / 3050, Radeon RX 590 / 5600' },
  { key: 'gpu-6', kind: 'dedicated', tier: 6, title: 'Strong graphics card',
    detail: 'GTX 1080, RTX 2070 / 3060 / 4050 / 4060 / 5050, Radeon RX 5700 / 6600 / 7600' },
  { key: 'gpu-7', kind: 'dedicated', tier: 7, title: 'Very strong graphics card',
    detail: 'RTX 2080 / 3060 Ti / 3070 / 4060 Ti / 5060, Radeon RX 6700 / 7700' },
  { key: 'gpu-8', kind: 'dedicated', tier: 8, title: 'High-end graphics card',
    detail: 'RTX 3080 / 4070 / 5070, Radeon RX 6800 / 7800' },
  { key: 'gpu-9', kind: 'dedicated', tier: 9, title: 'Top-end graphics card',
    detail: 'RTX 3090 / 4080 / 4090 / 5080 / 5090, Radeon RX 6900 / 7900' },
];

export const CPU_OPTIONS = [
  { key: 'cpu-1', tier: 1, title: 'Basic processor', detail: 'Intel Celeron / Pentium, AMD Athlon, older dual-core chips' },
  { key: 'cpu-2', tier: 2, title: 'Low-power laptop processor',
    detail: 'Intel Core i3 / i5 / i7 U-series or Y-series, AMD Ryzen 3 / 5 / 7 U-series (such as Ryzen 5 7520U)' },
  { key: 'cpu-3', tier: 3, title: 'Mainstream processor', detail: 'Intel Core i3 / i5, AMD Ryzen 3 / 5 (standard or H-series)' },
  { key: 'cpu-4', tier: 4, title: 'High-performance processor', detail: 'Intel Core i7, AMD Ryzen 7 (H-series or desktop)' },
  { key: 'cpu-5', tier: 5, title: 'Top processor', detail: 'Intel Core i9, AMD Ryzen 9' },
];

export const findGpuOption = (tier, kind) => GPU_OPTIONS.find((o) => o.tier === tier && o.kind === kind) || null;
export const findCpuOption = (tier) => CPU_OPTIONS.find((o) => o.tier === tier) || null;

// ---- Rating the graphics card named in a game's requirements -------------------------
const RTX = {
  20: { 50: 4, 60: 5, 70: 6, 80: 7 },
  30: { 50: 5, 60: 6, 70: 7, 80: 8, 90: 9 },
  40: { 50: 6, 60: 6, 70: 8, 80: 9, 90: 9 },
  50: { 50: 6, 60: 7, 70: 8, 80: 9, 90: 9 },
};
const GTX = {
  460: 2, 470: 2, 480: 3, 550: 2, 560: 2, 570: 3, 580: 3,
  650: 2, 660: 3, 670: 3, 680: 4, 690: 4,
  750: 2, 760: 3, 770: 4, 780: 4,
  950: 3, 960: 3, 970: 4, 980: 5,
  1050: 3, 1060: 4, 1070: 5, 1080: 6, 1650: 4, 1660: 4,
};
const RX = {
  460: 3, 470: 4, 480: 4, 550: 2, 560: 3, 570: 4, 580: 4, 590: 5,
  5500: 4, 5600: 5, 5700: 6, 6400: 3, 6500: 4, 6600: 6, 6650: 6, 6700: 7, 6750: 7, 6800: 8, 6900: 9, 6950: 9,
  7600: 6, 7700: 7, 7800: 8, 7900: 9,
};
const RADEON_R = { 250: 2, 260: 2, 270: 3, 280: 4, 285: 4, 290: 5, 380: 4, 390: 5 };
const ARC = { 380: 3, 580: 5, 750: 6, 770: 7 };

const bump = (n, plus) => Math.min(9, n + (plus ? 1 : 0));

export function gpuTierFromText(text) {
  if (!text) return null;
  const t = String(text).replace(/\s+/g, ' ');
  const found = [];

  for (const m of t.matchAll(/RTX\s*(\d{4})(\s*(?:Ti|Super))?/gi)) {
    const n = Number(m[1]);
    const base = RTX[Math.floor(n / 100)] && RTX[Math.floor(n / 100)][n % 100];
    if (base) found.push(bump(base, !!m[2]));
  }
  for (const m of t.matchAll(/GTX\s*(\d{3,4})(\s*(?:Ti|Super))?/gi)) {
    const n = Number(m[1]);
    if (GTX[n]) found.push(n === 1660 || n === 980 ? bump(GTX[n], !!m[2]) : GTX[n]);
  }
  for (const m of t.matchAll(/\bGT\s*(\d{3,4})/gi)) found.push(Number(m[1]) >= 1030 || Number(m[1]) === 740 ? 2 : 1);
  for (const m of t.matchAll(/\bRX\s*(\d{3,4})(\s*XT)?/gi)) {
    const n = Number(m[1]);
    if (RX[n]) found.push(RX[n]);
  }
  for (const m of t.matchAll(/\bR[79]\s*(\d{3})/gi)) {
    if (RADEON_R[Number(m[1])]) found.push(RADEON_R[Number(m[1])]);
  }
  for (const m of t.matchAll(/Radeon\s*HD\s*(\d{4})/gi)) {
    const n = Number(m[1]);
    found.push(n >= 7950 ? 4 : n >= 7850 ? 3 : n >= 5000 ? 2 : 1);
  }
  for (const m of t.matchAll(/Vega\s*(\d+)/gi)) {
    const n = Number(m[1]);
    found.push(n >= 64 ? 6 : n >= 56 ? 5 : 2);
  }
  if (/GeForce\s*(?:[6-9]\d{3}|9\d{2})\b/i.test(t)) found.push(1);
  if (/Radeon\s*VII/i.test(t)) found.push(7);
  for (const m of t.matchAll(/Arc\s*A(\d{3})/gi)) {
    if (ARC[Number(m[1])]) found.push(ARC[Number(m[1])]);
  }
  if (/Iris\s*Xe/i.test(t)) found.push(2);
  if (/Intel[^,;/]*?(?:HD|UHD)\s*Graphics/i.test(t)) found.push(1);

  // When a game lists alternatives ("GTX 970 / R9 290"), the weaker one is enough.
  return found.length ? Math.min(...found) : null;
}

// ---- Rating the processor named in a game's requirements -----------------------------
export function cpuTierFromText(text) {
  if (!text) return null;
  const t = String(text);
  const found = [];
  if (/Core\s*i9|Ryzen\s*9/i.test(t)) found.push(5);
  if (/Core\s*i7|Ryzen\s*7/i.test(t)) found.push(4);
  if (/Core\s*i5|Ryzen\s*5|\bFX\b/i.test(t)) found.push(3);
  if (/Core\s*i3|Ryzen\s*3|quad[- ]?core|Phenom/i.test(t)) found.push(2);
  if (/Celeron|Pentium|Athlon|Core\s*2|dual[- ]?core/i.test(t)) found.push(1);
  return found.length ? Math.min(...found) : null;
}
