import 'dotenv/config';
import crypto from 'node:crypto';
import cors from 'cors';
import express from 'express';
import { createClient } from 'redis';
import { Server } from 'socket.io';

const port = Number(process.env.PORT || 3001);
const matchDurationMs = 60_000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const redisPassword = process.env.REDIS_PASSWORD || 'agent67-local-dev';
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: redisPassword,
});
const app = express();
let io;

redis.on('error', (error) => console.error('redis error', error.message));
try {
  await redis.connect();
} catch (error) {
  console.error('could not connect to redis; check REDIS_URL and REDIS_PASSWORD', error.message);
  process.exit(1);
}

const httpServer = app.listen(port, () => {
  console.log(`multiplayer server listening on ${port}`);
});
io = new Server(httpServer, {
  cors: { origin: clientOrigin, methods: ['GET', 'POST'] },
});

app.get('/health', async (_request, response) => {
  const redisReady = redis.isReady;
  response.status(redisReady ? 200 : 503).json({ ok: redisReady });
});

const roomKey = (roomId) => `room:${roomId}`;
const playersKey = (roomId) => `room:${roomId}:players`;
const usernameKey = (roomId) => `room:${roomId}:usernames`;
const playerKey = (roomId, socketId) => `room:${roomId}:player:${socketId}`;

function validateUsername(value) {
  const username = typeof value === 'string' ? value.trim() : '';
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return { error: 'username must be 3-20 characters using letters, numbers, _ or -' };
  }
  return { username };
}

function validateRoomId(value) {
  const roomId = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z0-9]{6}$/.test(roomId)) return { error: 'room id is invalid' };
  return { roomId };
}

async function createRoomId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomId = crypto.randomBytes(4).toString('base64url').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!(await redis.exists(roomKey(roomId)))) return roomId;
  }
  throw new Error('could not create a room id');
}

async function roomSnapshot(roomId) {
  const [room, socketIds] = await Promise.all([
    redis.hGetAll(roomKey(roomId)),
    redis.sMembers(playersKey(roomId)),
  ]);
  const players = await Promise.all(socketIds.map(async (socketId) => {
    const player = await redis.hGetAll(playerKey(roomId, socketId));
    return { username: player.username, score: Number(player.score || 0), connected: player.connected === 'true' };
  }));
  return {
    roomId,
    status: room.status,
    ownerSocketId: room.ownerSocketId,
    startAt: room.startAt ? Number(room.startAt) : null,
    players: players.filter((player) => player.username).sort((a, b) => b.score - a.score || a.username.localeCompare(b.username)),
  };
}

async function broadcastRoom(roomId) {
  io.to(roomId).emit('room:updated', await roomSnapshot(roomId));
}

function respond(acknowledge, payload) {
  if (typeof acknowledge === 'function') acknowledge(payload);
}

io.on('connection', (socket) => {
  socket.on('room:create', async ({ username }, acknowledge) => {
    const validated = validateUsername(username);
    if (validated.error) return respond(acknowledge, { ok: false, error: validated.error });

    try {
      const roomId = await createRoomId();
      await redis.hSet(roomKey(roomId), { ownerSocketId: socket.id, status: 'lobby' });
      await joinRoom(socket, roomId, validated.username);
      respond(acknowledge, { ok: true, room: await roomSnapshot(roomId) });
    } catch (error) {
      respond(acknowledge, { ok: false, error: 'unable to create room' });
      console.error(error);
    }
  });

  socket.on('room:join', async ({ roomId: rawRoomId, username }, acknowledge) => {
    const roomValidated = validateRoomId(rawRoomId);
    const usernameValidated = validateUsername(username);
    if (roomValidated.error || usernameValidated.error) {
      return respond(acknowledge, { ok: false, error: roomValidated.error || usernameValidated.error });
    }
    if (!(await redis.exists(roomKey(roomValidated.roomId)))) {
      return respond(acknowledge, { ok: false, error: 'room not found' });
    }
    const status = await redis.hGet(roomKey(roomValidated.roomId), 'status');
    if (status !== 'lobby') return respond(acknowledge, { ok: false, error: 'this match has already started' });
    const usernameTaken = await redis.sIsMember(usernameKey(roomValidated.roomId), usernameValidated.username.toLowerCase());
    if (usernameTaken) return respond(acknowledge, { ok: false, error: 'that username is already in this room' });

    await joinRoom(socket, roomValidated.roomId, usernameValidated.username);
    respond(acknowledge, { ok: true, room: await roomSnapshot(roomValidated.roomId) });
  });

  socket.on('match:start', async (acknowledge) => {
    const { roomId } = socket.data;
    if (!roomId) return respond(acknowledge, { ok: false, error: 'join a room first' });
    const room = await redis.hGetAll(roomKey(roomId));
    if (room.ownerSocketId !== socket.id) return respond(acknowledge, { ok: false, error: 'only the room creator can start' });
    if (room.status !== 'lobby') return respond(acknowledge, { ok: false, error: 'match has already started' });

    const startAt = Date.now() + 3000;
    await redis.hSet(roomKey(roomId), { status: 'countdown', startAt: String(startAt) });
    io.to(roomId).emit('match:starting', { startAt });
    await broadcastRoom(roomId);
    setTimeout(async () => {
      if (await redis.hGet(roomKey(roomId), 'startAt') !== String(startAt)) return;
      await redis.hSet(roomKey(roomId), { status: 'playing' });
      io.to(roomId).emit('match:started', { startAt });
      await broadcastRoom(roomId);
    }, Math.max(0, startAt - Date.now()));
    setTimeout(async () => {
      if (await redis.hGet(roomKey(roomId), 'startAt') !== String(startAt)) return;
      await redis.hSet(roomKey(roomId), { status: 'finished' });
      io.to(roomId).emit('match:finished');
      await broadcastRoom(roomId);
    }, Math.max(0, startAt + matchDurationMs - Date.now()));
    respond(acknowledge, { ok: true, startAt });
  });

  socket.on('score:hit', async (acknowledge) => {
    const { roomId } = socket.data;
    if (!roomId || await redis.hGet(roomKey(roomId), 'status') !== 'playing') return;
    const key = playerKey(roomId, socket.id);
    if (!(await redis.exists(key))) return;
    const now = Date.now();
    const lastHitAt = Number(await redis.hGet(key, 'lastHitAt') || 0);
    if (now - lastHitAt < 80) return;
    await redis.multi()
      .hSet(key, 'lastHitAt', String(now))
      .hIncrBy(key, 'score', 10)
      .exec();
    await broadcastRoom(roomId);
    respond(acknowledge, { ok: true });
  });

  socket.on('disconnect', async () => {
    const { roomId, username } = socket.data;
    if (!roomId || !username) return;
    await redis.multi()
      .sRem(playersKey(roomId), socket.id)
      .sRem(usernameKey(roomId), username.toLowerCase())
      .del(playerKey(roomId, socket.id))
      .exec();
    const room = await redis.hGetAll(roomKey(roomId));
    if (room.ownerSocketId === socket.id) {
      const nextOwner = (await redis.sMembers(playersKey(roomId)))[0];
      if (nextOwner) await redis.hSet(roomKey(roomId), 'ownerSocketId', nextOwner);
    }
    await broadcastRoom(roomId);
  });
});

async function joinRoom(socket, roomId, username) {
  const playerCount = await redis.sCard(playersKey(roomId));
  socket.join(roomId);
  socket.data.roomId = roomId;
  socket.data.username = username;
  await redis.multi()
    .sAdd(playersKey(roomId), socket.id)
    .sAdd(usernameKey(roomId), username.toLowerCase())
    .hSet(playerKey(roomId, socket.id), { username, score: '0', connected: 'true' })
    .expire(roomKey(roomId), 7200)
    .expire(playersKey(roomId), 7200)
    .expire(usernameKey(roomId), 7200)
    .exec();
  if (playerCount === 0) await redis.hSet(roomKey(roomId), 'ownerSocketId', socket.id);
  await broadcastRoom(roomId);
}
