type Vec = { x: number; y: number };
type Entity = {
  id: string;
  ownerId: string;
  card_id: string;
  mob_type: string;
  rarity: string;
  hp: number;
  dmg: number;
  spd: number;
  pos: Vec;
  vel: Vec;
};

type SpawnPayload = {
  ownerId: string;
  card_id: string;
  mob_type: string;
  rarity: string;
  hp: number;
  dmg: number;
  spd: number;
  pos?: Vec;
};

export class ArenaSim {
  entities: Map<string, Entity> = new Map();
  bounds = { w: 2000, h: 1200 };
  lastId = 0;

  spawn(payload: SpawnPayload) {
    const id = `e_${this.lastId++}`;
    const e: Entity = {
      id,
      ownerId: payload.ownerId,
      card_id: payload.card_id,
      mob_type: payload.mob_type,
      rarity: payload.rarity,
      hp: payload.hp,
      dmg: payload.dmg,
      spd: payload.spd,
      pos: payload.pos ?? { x: Math.random() * this.bounds.w * 0.8 + 100, y: Math.random() * this.bounds.h * 0.8 + 100 },
      vel: { x: 0, y: 0 }
    };
    this.entities.set(id, e);
    return e;
  }

  remove(id: string) { this.entities.delete(id); }

  private findTarget(src: Entity): Entity | null {
    let best: Entity | null = null;
    let bestDist = Infinity;
    for (const e of this.entities.values()) {
      if (e.ownerId === src.ownerId) continue;
      const dx = e.pos.x - src.pos.x;
      const dy = e.pos.y - src.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist) { bestDist = d; best = e; }
    }
    return best;
  }

  private clampToBounds(e: Entity) {
    e.pos.x = Math.max(20, Math.min(this.bounds.w - 20, e.pos.x));
    e.pos.y = Math.max(20, Math.min(this.bounds.h - 20, e.pos.y));
  }

  tick(dt = 0.033) {
    for (const e of this.entities.values()) {
      const t = this.findTarget(e);
      if (t) {
        const dx = t.pos.x - e.pos.x;
        const dy = t.pos.y - e.pos.y;
        const len = Math.max(1e-3, Math.sqrt(dx * dx + dy * dy));
        e.vel.x = (dx / len) * e.spd * 60 * dt;
        e.vel.y = (dy / len) * e.spd * 60 * dt;

        if (len < 30) t.hp -= e.dmg * dt;
      } else {
        e.vel.x *= 0.9; e.vel.y *= 0.9;
      }
      e.pos.x += e.vel.x; e.pos.y += e.vel.y;
      this.clampToBounds(e);
    }
    for (const e of Array.from(this.entities.values())) {
      if (e.hp <= 0) this.entities.delete(e.id);
    }
    return this.snapshot();
  }

  snapshot() {
    return Array.from(this.entities.values()).map(e => ({
      id: e.id,
      ownerId: e.ownerId,
      card_id: e.card_id,
      mob_type: e.mob_type,
      rarity: e.rarity,
      hp: Math.max(0, Math.round(e.hp)),
      pos: { x: Math.round(e.pos.x), y: Math.round(e.pos.y) }
    }));
  }

  reset() { this.entities.clear(); this.lastId = 0; }
}
