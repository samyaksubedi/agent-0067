import { useState } from 'react';

export default function RoomLobby({ connected, room, error, isModelReady, isCameraReady, onStartCamera, onCreateRoom, onJoinRoom, onStartMatch }) {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const isOwner = room?.ownerSocketId && room.ownerSocketId === room.selfSocketId;

  if (room) {
    return (
      <div className="start-overlay">
        <h2>MISSION LOBBY</h2>
        <p className="room-code">ROOM CODE: {room.roomId}</p>
        <p>share this code with your squad</p>
        <div className="lobby-players">
          {room.players.map((player) => <div key={player.username}>{player.username}</div>)}
        </div>
        <button onClick={onStartCamera} disabled={!isModelReady || isCameraReady} className="start-game-btn">
          {!isModelReady ? 'LOADING MODEL...' : isCameraReady ? 'CAMERA READY' : 'START CAMERA'}
        </button>
        {room.status === 'countdown' && <p>mission launches in a moment...</p>}
        {isOwner && room.status === 'lobby' && (
          <button onClick={onStartMatch} className="start-game-btn">START MATCH</button>
        )}
        {!isOwner && room.status === 'lobby' && <p>waiting for the room creator to start...</p>}
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="start-overlay">
      <h2>AGENT 67 MULTIPLAYER</h2>
      <div className="instructions">
        <p>choose a unique username, then create or join a room</p>
        <p>username: 3-20 letters, numbers, _ or -</p>
      </div>
      <input className="lobby-input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" maxLength="20" />
      <button onClick={() => onCreateRoom(username)} disabled={!connected} className="start-game-btn">CREATE ROOM</button>
      <div className="join-row">
        <input className="lobby-input" value={roomId} onChange={(event) => setRoomId(event.target.value.toUpperCase())} placeholder="room code" maxLength="6" />
        <button onClick={() => onJoinRoom(roomId, username)} disabled={!connected} className="start-game-btn">JOIN ROOM</button>
      </div>
      <button onClick={onStartCamera} disabled={!isModelReady || isCameraReady} className="start-game-btn">
        {!isModelReady ? 'LOADING MODEL...' : isCameraReady ? 'CAMERA READY' : 'START CAMERA'}
      </button>
      {!connected && <p>connecting to game server...</p>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
