export type Rarity =
  | 'common'
  | 'unusual'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'ultra'
  | 'super';

export type Mode = '1v1' | 'team' | 'solo';

export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface InventoryRow {
  owner_id: string;
  card_id: string;
  mob_type: string;
  rarity: Rarity;
  quantity: number;
  health: number;
  damage: number;
  speed: number;
  image_url: string | null;
}

export interface MatchRow {
  match_id: string;
  mode: Mode;
  status: 'queued' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MatchPlayerRow {
  match_id: string;
  owner_id: string;
  team_index: number | null;
  deck_id: string | null;
  is_winner: boolean | null;
  joined_at: string;
  left_at: string | null;
}
