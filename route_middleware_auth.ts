import createHttpError from 'http-errors';
import type { Request, Response, NextFunction } from 'express';
import { getBearerToken } from './jwt.js';
import { supabaseAdmin } from './supabase.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req.headers.authorization);
    const { data: user, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user?.user) throw createHttpError(401, 'Invalid token');
    // @ts-expect-error augmenting request
    req.user = { id: user.user.id, email: user.user.email };
    next();
  } catch (err) { next(err); }
}
