import { supabaseAdmin } from './supabase.js';

export async function getDeck(ownerId: string, deckId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_decks')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('deck_id', deckId)
    .single();
  if (error) throw error;
  return data;
}

export async function getDeckCards(deckId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_deck_cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('slot_index', { ascending: true });
  if (error) throw error;
  return data;
}
