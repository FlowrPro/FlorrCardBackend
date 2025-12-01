import type { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { env } from './env.js';
import { log, warn } from './logger.js';
import { supabaseAdmin } from './supabase.js';
import { MatchOrchestrator } from './matchOrchestrator.js';
import { createMatch, joinMatch, setMatchStatus } from './matchState.js';

function attachAuthHandlers(socket: any) {
  socket.data.userId = null;
  socket.on('auth', async ({ token }: { token: string }) => {
    try {
      const { data: user, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user?.user) {
        socket.emit('auth:error', 'Invalid token');
        socket.disconnect(true);
        return;
      }
      socket.data.userId = user.user.id;
      socket.emit('auth:ok', { userId: socket.data.userId });
    } catch {
      socket.emit('auth:error', 'Auth failed');
      socket.disconnect(true);
    }
  });
}

export function createSocketServer(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, methods: ['GET','POST'] }
  });

  const ns = io.of('/match');
  const orchestrator = new MatchOrchestrator(ns);

  ns.on('connection', (socket) => {
    log('Match namespace connection', socket.id);
    attachAuthHandlers(socket);

    socket.on('match:create', async ({ mode }: { mode: '1v1' | 'team' | 'solo' }) => {
      try {
        const m = await createMatch(mode);
        socket.emit('match:created', { match: m });
      } catch (err: any) { socket.emit('error', err.message); }
    });

    socket.on('join', async ({ matchId, teamIndex, deckId, mode }: { matchId: string; teamIndex: number | null; deckId: string | null; mode: '1v1' | 'team' | 'solo' }) => {
      try {
        if (!socket.data.userId) return socket.emit('error', 'Not authenticated');
        await joinMatch(matchId, socket.data.userId, teamIndex ?? null, deckId ?? null);
        socket.join(matchId);
        const room = orchestrator.addPlayer(matchId, socket.data.userId, teamIndex ?? null, deckId ?? null, mode);
        ns.to(matchId).emit('system:joined', { userId: socket.data.userId, teamIndex, deckId });

        if (room.mode === '1v1') {
          const teams = Array.from(room.players.values()).filter(p => p.teamIndex !== null);
          const t0 = teams.filter(p => p.teamIndex === 0).length;
          const t1 = teams.filter(p => p.teamIndex === 1).length;
          if (t0 >= 1 && t1 >= 1 && room.status === 'queued') {
            await setMatchStatus(matchId, 'starting');
            orchestrator.start(matchId);
          }
        } else if (room.mode === 'team') {
          if (room.players.size >= 2 && room.status === 'queued') {
            await setMatchStatus(matchId, 'starting');
            orchestrator.start(matchId);
          }
        } else if (room.mode === 'solo') {
          await setMatchStatus(matchId, 'starting');
          orchestrator.start(matchId);
        }
      } catch (err: any) { socket.emit('error', err.message); }
    });

    socket.on('card:play', async ({ matchId, card_id }: { matchId: string; card_id: string }) => {
      if (!socket.data.userId) return socket.emit('error', 'Not authenticated');
      try { await orchestrator.playCard(matchId, socket.data.userId, card_id); }
      catch (err: any) { socket.emit('error', err.message); }
    });

    socket.on('disconnect', () => { warn('Match socket disconnected', socket.id); });
  });

  io.on('connection', (socket) => {
    log('Root namespace connection', socket.id);
    socket.on('disconnect', () => log('Root disconnected', socket.id));
  });

  return io;
}
