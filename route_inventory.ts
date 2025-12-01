import { Router } from 'express';
import { getAllCardStats, getUserInventory } from './cardStats.js';
import { requireAuth } from './route_middleware_auth.js';

export const inventoryRouter = Router();

inventoryRouter.get('/catalog', async (_req, res, next) => {
  try {
    const data = await getAllCardStats();
    res.json({ data });
  } catch (err) { next(err); }
});

inventoryRouter.get('/mine', requireAuth, async (req, res, next) => {
  try {
    // @ts-expect-error injected
    const ownerId: string = req.user.id;
    const data = await getUserInventory(ownerId);
    res.json({ data });
  } catch (err) { next(err); }
});
