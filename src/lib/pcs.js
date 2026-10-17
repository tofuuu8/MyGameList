import { supabase } from './supabase';

// A person can save several PCs (a laptop, a desktop...). One of them is "active":
// the app uses it for the Can run / Might struggle results.

export async function loadPcs() {
  const { data, error } = await supabase.from('pc_specs').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// The PC used for results. Falls back to the first saved PC (or none) if anything is missing.
export async function loadActivePc() {
  try {
    const { data, error } = await supabase.from('pc_specs').select('*').eq('is_active', true).limit(1);
    if (!error && data && data.length > 0) return data[0];
  } catch {
    // fall through
  }
  try {
    const { data } = await supabase.from('pc_specs').select('*').limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export async function setActivePc(userId, id) {
  const off = await supabase.from('pc_specs').update({ is_active: false }).eq('user_id', userId).eq('is_active', true);
  if (off.error) throw off.error;
  const on = await supabase.from('pc_specs').update({ is_active: true }).eq('id', id);
  if (on.error) throw on.error;
}

// Saves an existing PC (id given) or adds a new one and makes it the active PC.
export async function savePc(userId, id, fields) {
  if (id) {
    const { data, error } = await supabase
      .from('pc_specs')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const off = await supabase.from('pc_specs').update({ is_active: false }).eq('user_id', userId).eq('is_active', true);
  if (off.error) throw off.error;
  const { data, error } = await supabase
    .from('pc_specs')
    .insert({ ...fields, user_id: userId, is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePc(id) {
  const { error } = await supabase.from('pc_specs').delete().eq('id', id);
  if (error) throw error;
}
