import { supabaseAdmin } from './supabase.js';

export async function getAllCardStats() {
  const { data, error } = await supabaseAdmin.from('v_card_stats').select('*');
  if (error) throw error;
  return data;
}

export async function getUserInventory(ownerId: string) {
  const { data, error } = await supabaseAdmin.from('v_user_inventory').select('*').eq('owner_id', ownerId);
  if (error) throw error;
  return data;
}

export async function craftUpgrade(ownerId: string, mobType: string, lowerRarity: string) {
  const { error } = await supabaseAdmin.rpc('craft_upgrade', { p_owner: ownerId, p_mob_type: mobType, p_lower: lowerRarity });
  if (error) throw error;
  return { success: true };
}
