import { Router } from 'express';
import Joi from 'joi';
import { requireAuth } from './route_middleware_auth.js';
import { validateBody } from './validator.js';
import { createMatch, joinMatch, setMatchStatus } from './matchState.js';
import type { Mode } from './types.js';

export const matchmakingRouter = Router();

const createSchema = Joi.object({ mode: Joi.string().valid('1v1','team','solo').required() });

matchmakingRouter.post('/create', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ mode: Mode }>(createSchema, req.body);
    const match = await createMatch(body.mode);
    res.json({ match });
  } catch (err) { next(err); }
});

const joinSchema = Joi.object({
  match_id: Joi.string().uuid().required(),
  team_index: Joi.number().integer().allow(null),
  deck_id: Joi.string().uuid().allow(null)
});

matchmakingRouter.post('/join', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ match_id: string; team_index: number | null; deck_id: string | null }>(joinSchema, req.body);
    // @ts-expect-error injected
    const ownerId: string = req.user.id;
    const mp = await joinMatch(body.match_id, ownerId, body.team_index ?? null, body.deck_id ?? null);
    res.json({ player: mp });
  } catch (err) { next(err); }
});

const statusSchema = Joi.object({
  match_id: Joi.string().uuid().required(),
  status: Joi.string().valid('queued','starting','in_progress','completed','cancelled').required()
});

matchmakingRouter.post('/status', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ match_id: string; status: 'queued' | 'starting' | 'in_progress' | 'completed' | 'cancelled' }>(statusSchema, req.body);
    const m = await setMatchStatus(body.match_id, body.status);
    res.json({ match: m });
  } catch (err) { next(err); }
});
