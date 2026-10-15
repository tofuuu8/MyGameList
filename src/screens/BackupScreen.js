import { useState } from 'react';
import { Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { onlyNewGames, parseBackup, toBackupJson, toCsv } from '../lib/backupFormat';
import { pickTextFile, saveAndShare } from '../lib/backup';
import { friendlyError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { loadExistingGames } from '../lib/steam';
import { fonts, useTheme } from '../theme';

const stamp = () => new Date().toISOString().slice(0, 10);

async function loadAllGames() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('games').select('*').order('created_at').range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

export default function BackupScreen({ navigation }) {
  const t = useTheme();
  const { session } = useAuth();
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 };
  const body = { fontFamily: fonts.regular, fontSize: 13, color: t.muted, lineHeight: 19 };

  async function run(name, work) {
    setBusy(name);
    setMessage('');
    setError('');
    try {
      await work();
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy('');
  }

  const exportFile = (kind) => run(kind, async () => {
    const games = await loadAllGames();
    if (games.length === 0) {
      setError('Your library is empty, so there is nothing to save yet.');
      return;
    }
    if (kind === 'csv') await saveAndShare(`MyGameList-${stamp()}.csv`, 'text/csv', toCsv(games));
    else await saveAndShare(`MyGameList-backup-${stamp()}.json`, 'application/json', toBackupJson(games));
    setMessage(`Saved ${games.length} ${games.length === 1 ? 'game' : 'games'}.`);
  });

  const restore = () => run('restore', async () => {
    const raw = await pickTextFile();
    if (raw == null) return; // cancelled
    const rows = onlyNewGames(parseBackup(raw), await loadExistingGames());
    if (rows.length === 0) {
      setMessage('Nothing to restore. Every game in that file is already in your library.');
      return;
    }
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map((r) => ({ ...r, user_id: session.user.id }));
      const { error: err } = await supabase.from('games').upsert(chunk, { onConflict: 'user_id,steam_appid', ignoreDuplicates: true });
      if (err) throw err;
    }
    setMessage(`Restored ${rows.length} ${rows.length === 1 ? 'game' : 'games'}. Games you already had were left alone.`);
  });

  return (
    <AuthLayout
      onBack={() => navigation.goBack()}
      title="Backup and restore"
      subtitle="Keep a copy of your library, or bring it back later."
    >
      <View style={{ gap: 14 }}>
        <View style={card}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>Backup file</Text>
          <Text style={body}>Saves everything, including notes, ratings, hours and goals. Keep it somewhere safe, like your email or cloud drive.</Text>
          <Button title="Save a backup file" onPress={() => exportFile('json')} loading={busy === 'json'} />
        </View>

        <View style={card}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>Spreadsheet</Text>
          <Text style={body}>Saves your library as a CSV file you can open in Excel or Google Sheets.</Text>
          <Button title="Save as spreadsheet" variant="secondary" onPress={() => exportFile('csv')} loading={busy === 'csv'} />
        </View>

        <View style={card}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: t.text }}>Restore</Text>
          <Text style={body}>Choose a MyGameList backup file. Games you already have are skipped, so nothing is duplicated or overwritten.</Text>
          <Button title="Restore from a backup file" variant="secondary" onPress={restore} loading={busy === 'restore'} />
        </View>

        {!!message && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>{message}</Text>}
        {!!error && <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.regular, fontSize: 13, color: t.link }}>{error}</Text>}
      </View>
    </AuthLayout>
  );
}
