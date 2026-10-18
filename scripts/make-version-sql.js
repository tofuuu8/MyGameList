// Prints the SQL that tells installed apps a new version is available.
// Usage:   node scripts/make-version-sql.js 1.2.0 "https://github.com/YOU/REPO/releases/download/v1.2.0/MyGameList-1.2.0.apk" "What is new"
// Then paste the result into Supabase: SQL Editor, New query, Run.
const [version, url, notes] = process.argv.slice(2);

if (!/^\d+\.\d+\.\d+$/.test(version || '') || !/^https:\/\//.test(url || '')) {
  console.error('Usage: node scripts/make-version-sql.js 1.2.0 "https://...apk" "What is new"');
  console.error('The version must look like 1.2.0, and the link must start with https://');
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const text = (notes || 'A new version of MyGameList is available.').slice(0, 300);

console.log(`insert into public.app_versions (version, apk_url, notes)
values (${q(version)}, ${q(url)}, ${q(text)})
on conflict (version) do update set apk_url = excluded.apk_url, notes = excluded.notes, created_at = now();`);
