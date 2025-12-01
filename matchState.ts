import { supabaseAdmin } from './supabase.js';
import { Mode } from './types.js';

export async function createMatch(mode: Mode) {
  const { data, error } = await supabaseAdmin.from('matches').insert({ mode, status: 'queued' }).select().single();
  if (error) throw error;
  return data;
}

export async function joinMatch(matchId: string, ownerId: string, teamIndex: number | null, deckId: string | null) {
  const payload = { match_id: matchId, owner_id: ownerId, team_index: teamIndex, deck_id: deckId, is_winner: null };
  const { data, error } = await supabaseAdmin.from('match_players').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function setMatchStatus(matchId: string, status: 'queued' | 'starting' | 'in_progress' | 'completed' | 'cancelled') {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('match_id', matchId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
