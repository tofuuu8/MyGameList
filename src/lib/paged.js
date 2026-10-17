import { supabase } from './supabase';

// The database returns at most 1000 rows per request, so big libraries are loaded in pages.
export async function fetchAllGames(columns = '*') {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('games')
      .select(columns)
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}
