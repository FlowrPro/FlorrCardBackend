import { Router } from 'express';
import { requireAuth } from './route_middleware_auth.js';
import { supabaseAdmin } from './supabase.js';
import Joi from 'joi';
import { validateBody } from './validator.js';

export const arenaRouter = Router();

arenaRouter.get('/match/:id', requireAuth, async (req, res, next) => {
  try {
    const match_id = req.params.id;
    const { data: match, error: mErr } = await supabaseAdmin.from('matches').select('*').eq('match_id', match_id).single();
    if (mErr) throw mErr;
    const { data: players, error: pErr } = await supabaseAdmin.from('match_players').select('*').eq('match_id', match_id);
    if (pErr) throw pErr;
    res.json({ match, players });
  } catch (err) { next(err); }
});

const winSchema = Joi.object({
  match_id: Joi.string().uuid().required(),
  winner_owner_id: Joi.string().uuid().required()
});
arenaRouter.post('/winner', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ match_id: string; winner_owner_id: string }>(winSchema, req.body);
    const { error } = await supabaseAdmin
      .from('match_players')
      .update({ is_winner: true })
      .eq('match_id', body.match_id)
      .eq('owner_id', body.winner_owner_id);
    if (error) throw error;
    await supabaseAdmin.from('matches').update({ status: 'completed' }).eq('match_id', body.match_id);
    res.json({ success: true });
  } catch (err) { next(err); }
});
