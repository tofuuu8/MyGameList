import { ownedCpuFromText, ownedGpuFromText } from './hardware';

const RAM_STEPS = [4, 8, 16, 32, 64];
const nearest = (value, steps) => steps.reduce((best, x) => (Math.abs(x - value) < Math.abs(best - value) ? x : best), steps[0]);

// Finds the text after a label, for example "Processor<TAB>AMD Ryzen 5 7520U".
function valueAfter(text, label) {
  const m = String(text).match(new RegExp(`^[ \\t]*${label}[\\t :]+(.+)$`, 'im'));
  return m ? m[1].trim() : null;
}

const toGb = (n, unit) => (unit.toUpperCase() === 'TB' ? n * 1024 : n);

// Reads what Windows copies from Settings > System > About > Device specifications > Copy.
// Anything it cannot read is listed in `missing`, so the person can choose it by hand.
export function parseWindowsSpecs(text) {
  const out = { cpu: null, ram: null, gpu: null, diskFree: null, pcType: null, missing: [] };

  const cpuText = valueAfter(text, 'Processor');
  const cpu = ownedCpuFromText(cpuText);
  if (cpu) {
    out.cpu = { ...cpu, text: cpuText.replace(/\s*(CPU\s*)?@?\s*\(?\s*\d+(\.\d+)?\s*GHz\)?.*$/i, '').trim().slice(0, 80) };
    if (cpu.mobile === true) out.pcType = 'laptop';
  } else out.missing.push('processor');

  const ramText = valueAfter(text, 'Installed RAM');
  const ramMatch = ramText && ramText.match(/([\d.,]+)\s*GB/i);
  if (ramMatch) out.ram = nearest(parseFloat(ramMatch[1].replace(',', '.')), RAM_STEPS);
  else out.missing.push('memory (RAM)');

  const gpuText = valueAfter(text, 'Graphics card');
  const gpu = ownedGpuFromText(gpuText);
  if (gpu && (gpu.kind === 'integrated' || gpu.tier != null)) out.gpu = gpu;
  else out.missing.push('graphics');

  const storage = valueAfter(text, 'Storage');
  const sm = storage && storage.match(/([\d.,]+)\s*(GB|TB)\s*of\s*([\d.,]+)\s*(GB|TB)/i);
  if (sm) {
    const used = toGb(parseFloat(sm[1].replace(',', '.')), sm[2]);
    const total = toGb(parseFloat(sm[3].replace(',', '.')), sm[4]);
    if (total > used) out.diskFree = Math.round(total - used);
  }
  if (out.diskFree == null) out.missing.push('free disk space');

  return out;
}
