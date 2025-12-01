import { Namespace } from 'socket.io';
import { ArenaSim } from './mobSim.js';
import { supabaseAdmin } from './supabase.js';
import { getDeckCards } from './deckService.js';

type PlayerCtx = { ownerId: string; deckId: string | null; teamIndex: number | null; };
type RoomState = {
  matchId: string;
  mode: '1v1' | 'team' | 'solo';
  status: 'queued' | 'starting' | 'in_progress' | 'completed' | 'cancelled';
  players: Map<string, PlayerCtx>;
  sim: ArenaSim;
  tickHandle: NodeJS.Timeout | null;
  startedAt: number | null;
};

export class MatchOrchestrator {
  rooms: Map<string, RoomState> = new Map();
  ns: Namespace;

  constructor(ns: Namespace) { this.ns = ns; }

  ensureRoom(matchId: string, mode: RoomState['mode']): RoomState {
    let r = this.rooms.get(matchId);
    if (!r) {
      r = { matchId, mode, status: 'queued', players: new Map(), sim: new ArenaSim(), tickHandle: null, startedAt: null };
      this.rooms.set(matchId, r);
    }
    return r;
  }

  addPlayer(matchId: string, ownerId: string, teamIndex: number | null, deckId: string | null, mode: RoomState['mode']) {
    const r = this.ensureRoom(matchId, mode);
    r.players.set(ownerId, { ownerId, deckId, teamIndex });
    this.ns.to(matchId).emit('system:joined', { userId: ownerId, teamIndex, deckId });
    return r;
  }

  private async getCardStats(card_id: string) {
    const { data, error } = await supabaseAdmin.from('v_card_stats').select('*').eq('card_id', card_id).single();
    if (error) throw error;
    return data;
  }

  async start(matchId: string) {
    const r = this.rooms.get(matchId);
    if (!r) throw new Error('Room not found');
    if (r.status !== 'queued' && r.status !== 'starting') return;

    r.status = 'in_progress';
    r.startedAt = Date.now();

    for (const p of r.players.values()) {
      if (!p.deckId) continue;
      const deckCards = await getDeckCards(p.deckId);
      const initial = deckCards.slice(0, 5);
      for (const dc of initial) {
        const stats = await this.getCardStats(dc.card_id);
        r.sim.spawn({
          ownerId: p.ownerId,
          card_id: dc.card_id,
          mob_type: stats.mob_type,
          rarity: stats.rarity,
          hp: stats.health,
          dmg: stats.damage,
          spd: Number(stats.speed)
        });
      }
    }

    this.ns.to(matchId).emit('match:started', { matchId });
    this.beginTick(matchId);
  }

  private beginTick(matchId: string) {
    const r = this.rooms.get(matchId);
    if (!r) return;
    if (r.tickHandle) clearInterval(r.tickHandle);
    r.tickHandle = setInterval(() => {
      const snapshot = r.sim.tick(0.033);
      this.ns.to(matchId).emit('tick', { entities: snapshot });
      this.checkWin(matchId);
    }, 33);
  }

  async playCard(matchId: string, ownerId: string, card_id: string) {
    const r = this.rooms.get(matchId);
    if (!r || r.status !== 'in_progress') return;
    const stats = await this.getCardStats(card_id);
    r.sim.spawn({
      ownerId, card_id,
      mob_type: stats.mob_type,
      rarity: stats.rarity,
      hp: stats.health, dmg: stats.damage, spd: Number(stats.speed)
    });
    this.ns.to(matchId).emit('card:played', { by: ownerId, card_id });
  }

  private checkWin(matchId: string) {
    const r = this.rooms.get(matchId);
    if (!r) return;
    const teamsAlive = new Map<number | 'solo', number>();
    for (const e of r.sim.entities.values()) {
      const team = r.players.get(e.ownerId)?.teamIndex ?? 'solo';
      teamsAlive.set(team, (teamsAlive.get(team) ?? 0) + 1);
    }
    if (r.mode === '1v1' || r.mode === 'team') {
      const aliveTeams = Array.from(teamsAlive.entries()).filter(([_, count]) => count > 0);
      if (aliveTeams.length <= 1 && r.status === 'in_progress') {
        this.finish(matchId, aliveTeams[0]?.[0] ?? null);
      }
    }
  }

  async finish(matchId: string, winnerTeam: number | 'solo' | null) {
    const r = this.rooms.get(matchId);
    if (!r) return;
    r.status = 'completed';
    if (r.tickHandle) { clearInterval(r.tickHandle); r.tickHandle = null; }
    this.ns.to(matchId).emit('match:completed', { winnerTeam });

    await supabaseAdmin.from('matches').update({ status: 'completed' }).eq('match_id', matchId);

    if (winnerTeam !== null) {
      for (const p of r.players.values()) {
        const isWinner = p.teamIndex === winnerTeam || (winnerTeam === 'solo' && r.mode === 'solo');
        await supabaseAdmin.from('match_players').update({ is_winner: isWinner }).eq('match_id', matchId).eq('owner_id', p.ownerId);
      }
    }
  }

  teardown(matchId: string) {
    const r = this.rooms.get(matchId);
    if (!r) return;
    if (r.tickHandle) clearInterval(r.tickHandle);
    r.sim.reset();
    this.rooms.delete(matchId);
  }
}
