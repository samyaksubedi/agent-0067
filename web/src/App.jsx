import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useMediaPipe } from './hooks/useMediaPipe';
import GameCanvas from './components/GameCanvas';
import VideoOverlay from './components/VideoOverlay';
import HUD from './components/HUD';
import RoomLobby from './components/RoomLobby';
import GameOverMenu from './components/GameOverMenu';
import './App.css';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  const { videoRef, landmarkerRef, isModelReady, isRunning, errorMsg, startCamera } = useMediaPipe();
  const socketRef = useRef(null);
  const startTimerRef = useRef(null);
  const playerXRef = useRef(400);
  const bulletsRef = useRef([]);
  const triggerShootRef = useRef(() => {});
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [roomError, setRoomError] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const setSnapshot = useCallback((snapshot) => {
    setRoom({ ...snapshot, selfSocketId: socketRef.current?.id });
  }, []);

  const scheduleMatchStart = useCallback(({ startAt }) => {
    window.clearTimeout(startTimerRef.current);
    startTimerRef.current = window.setTimeout(() => {
      setScore(0);
      setTimeLeft(60);
      setGameOver(false);
      setGameStarted(true);
    }, Math.max(0, startAt - Date.now()));
  }, []);

  useEffect(() => {
    const socket = io(serverUrl, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setRoomError('could not connect to the game server'));
    socket.on('room:updated', setSnapshot);
    socket.on('match:starting', scheduleMatchStart);
    socket.on('match:started', scheduleMatchStart);
    return () => {
      window.clearTimeout(startTimerRef.current);
      socket.disconnect();
    };
  }, [scheduleMatchStart, setSnapshot]);

  const emitWithResponse = useCallback((event, payload) => {
    setRoomError('');
    const onResponse = (response) => {
      if (!response?.ok) {
        setRoomError(response?.error || 'something went wrong');
        return;
      }
      if (response.room) setSnapshot(response.room);
    };
    if (payload === undefined) socketRef.current?.emit(event, onResponse);
    else socketRef.current?.emit(event, payload, onResponse);
  }, [setSnapshot]);

  const handleEnemyHit = useCallback(() => {
    socketRef.current?.emit('score:hit');
  }, []);

  return (
    <div className="fullscreen-game">
      <GameCanvas
        gameStarted={gameStarted}
        setGameStarted={setGameStarted}
        setGameOver={setGameOver}
        setScore={setScore}
        setTimeLeft={setTimeLeft}
        playerXRef={playerXRef}
        bulletsRef={bulletsRef}
        triggerShootRef={triggerShootRef}
        onEnemyHit={handleEnemyHit}
      />

      <HUD score={score} timeLeft={timeLeft} gameStarted={gameStarted} leaderboard={room?.players || []} />

      {!gameStarted && !gameOver && (
        <RoomLobby
          connected={connected}
          room={room}
          error={roomError || errorMsg}
          isModelReady={isModelReady}
          isCameraReady={isRunning}
          onStartCamera={startCamera}
          onCreateRoom={(username) => emitWithResponse('room:create', { username })}
          onJoinRoom={(roomId, username) => emitWithResponse('room:join', { roomId, username })}
          onStartMatch={() => emitWithResponse('match:start')}
        />
      )}

      {gameOver && <GameOverMenu finalScore={score} />}

      {isRunning && (
        <VideoOverlay
          videoRef={videoRef}
          landmarkerRef={landmarkerRef}
          playerXRef={playerXRef}
          triggerShootRef={triggerShootRef}
        />
      )}
    </div>
  );
}
