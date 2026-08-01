# Agent 67 multiplayer

The project has a React/Vite game in `web/`, an Express and Socket.IO server in `server/`, and Redis room storage in Docker Compose.

## Start locally

1. Start Redis: `docker compose up -d redis`
2. Start the server: `cd server` then `npm run dev`
3. Start the game: `cd web` then `npm run dev`

The frontend connects to `http://localhost:3001` by default. Set `VITE_SERVER_URL` in `web/.env` when deploying the server elsewhere. Copy `server/.env.example` to `server/.env` to customize the server port, client origin, Redis address, or Redis password. The default local Redis password is `agent67-local-dev`; change `REDIS_PASSWORD` in both the root `.env` and `server/.env` together when needed.

## Match flow

Create a room with a validated username, share the six-character code, and have players join before the creator starts the match. The server broadcasts a common start timestamp, tracks each accepted enemy-hit score in Redis, and broadcasts the sorted live leaderboard to everyone in the room. Usernames are case-insensitively unique per room.
