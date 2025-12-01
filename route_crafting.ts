import { Router } from 'express';
import Joi from 'joi';
import { requireAuth } from './route_middleware_auth.js';
import { validateBody } from './validator.js';
import { craftUpgrade } from './cardStats.js';

export const craftingRouter = Router();

const craftSchema = Joi.object({
  mobType: Joi.string().valid('ant', 'beetle', 'rock', 'scorpion', 'hornet', 'bee').required(),
  lowerRarity: Joi.string().valid('common','unusual','rare','epic','legendary','mythic','ultra').required()
});

craftingRouter.post('/upgrade', requireAuth, async (req, res, next) => {
  try {
    const body = validateBody<{ mobType: string; lowerRarity: string }>(craftSchema, req.body);
    // @ts-expect-error injected
    const ownerId: string = req.user.id;
    const result = await craftUpgrade(ownerId, body.mobType, body.lowerRarity);
    res.json({ success: true, result });
  } catch (err) { next(err); }
});
