import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import createHttpError from 'http-errors';
import http from 'http';

import { env } from './env.js';
import { log, error as logError } from './logger.js';
import { inventoryRouter } from './route_inventory.js';
import { craftingRouter } from './route_crafting.js';
import { decksRouter } from './route_decks.js';
import { matchmakingRouter } from './route_matchmaking.js';
import { arenaRouter } from './route_arena.js';
import { createSocketServer } from './sockets.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/inventory', inventoryRouter);
app.use('/api/crafting', craftingRouter);
app.use('/api/decks', decksRouter);
app.use('/api/matchmaking', matchmakingRouter);
app.use('/api/arena', arenaRouter);

/* 404 */
app.use((_req, _res, next) => next(createHttpError(404, 'Route not found')));

/* Error handler */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) logError('ERR', err);
  res.status(status).json({ error: { status, message } });
});

const httpServer = http.createServer(app);
createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  log(`Backend listening on port ${env.PORT}`);
});
