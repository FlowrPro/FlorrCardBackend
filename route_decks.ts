import { Router } from 'express';
import Joi from 'joi';
import { requireAuth } from './route_middleware_auth.js';
import { validateBody } from './validator.js';
import { supabaseAdmin } from './supabase.js';

export const decksRouter = Router();

decksRouter.get('/mine', requireAuth, async (req, res, next) => {
  try {
    // @ts-expect-error injected
    const ownerId: string = req.user.id;
    const { data, error } = await supabaseAdmin.from('user_decks').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    res.json({ data });
  } catch (err) { next(err); }
});

const newDeckSchema = Joi.object({
  name: Joi.string().min(1).max(64).required(),
  max_slots: Joi.number().integer().min(1).max(60).default(20)
});

decksRouter.post('/create', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ name: string; max_slots: number }>(newDeckSchema, req.body);
    // @ts-expect-error injected
    const ownerId: string = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('user_decks')
      .insert({ owner_id: ownerId, name: body.name, max_slots: body.max_slots })
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (err) { next(err); }
});

const putCardSchema = Joi.object({
  deck_id: Joi.string().uuid().required(),
  card_id: Joi.string().required(),
  slot_index: Joi.number().integer().min(0).required(),
  quantity: Joi.number().integer().min(1).required()
});

decksRouter.post('/put-card', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ deck_id: string; card_id: string; slot_index: number; quantity: number }>(putCardSchema, req.body);
    const { data, error } = await supabaseAdmin
      .from('user_deck_cards')
      .insert({ deck_id: body.deck_id, card_id: body.card_id, slot_index: body.slot_index, quantity: body.quantity })
      .select()
      .single();
    if (error) throw error;
    res.json({ data });
  } catch (err) { next(err); }
});
