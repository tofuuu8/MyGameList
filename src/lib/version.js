import Constants from 'expo-constants';
import { supabase } from './supabase';

// The version of the installed app (the APK), not of the latest update inside it.
export const installedVersion = () => Constants.nativeAppVersion || (Constants.expoConfig && Constants.expoConfig.version) || '0.0.0';

// 1.10.0 is newer than 1.9.0. Returns 1 if a is newer, -1 if older, 0 if the same.
export function compareVersions(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

// The newest APK listed in the app_versions table, or null if the table is empty or unreachable.
export async function fetchLatestApk() {
  try {
    const { data, error } = await supabase
      .from('app_versions')
      .select('version,apk_url,notes,created_at')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0];
  } catch {
    return null;
  }
}
