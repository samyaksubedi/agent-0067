import { useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../constants/gameConfig';
import { drawPlayer } from '../game/player';
import { updateAndDrawEnemies, spawnEnemyIfNeeded } from '../game/enemy';
import { updateAndDrawBullets, createBullet } from '../game/bullet';

export default function GameCanvas({
  gameStarted,
  setGameStarted,
  setGameOver,
  setScore,
  setTimeLeft,
  playerXRef,
  bulletsRef,
  triggerShootRef,
  onEnemyHit,
}) {

  // declaring basic references
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const enemiesRef = useRef([]);
  const scoreRef = useRef(0);
  const lastEnemySpawnRef = useRef(0);
  const gameStartTimeRef = useRef(null);

  useEffect(() => {
    triggerShootRef.current = () => {
      if (!gameStarted) return;
      bulletsRef.current.push(createBullet(playerXRef.current, GAME_CONFIG.CANVAS_HEIGHT));
    };
  }, [bulletsRef, gameStarted, playerXRef, triggerShootRef]);

  // run the game loop
  useEffect(() => {
    if (!gameStarted) return;

    gameStartTimeRef.current = Date.now();
    scoreRef.current = 0;
    bulletsRef.current = [];
    enemiesRef.current = [];
    lastEnemySpawnRef.current = Date.now();

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // update the timer
      const elapsed = (Date.now() - gameStartTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_CONFIG.GAME_DURATION_SEC - Math.floor(elapsed));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setGameOver(true);
        setGameStarted(false);
        cancelAnimationFrame(gameLoopRef.current);
        return;
      }

      // clear the background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

      // draw the starfield
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 37) % GAME_CONFIG.CANVAS_WIDTH;
        const y = (i * 53) % GAME_CONFIG.CANVAS_HEIGHT;
        ctx.fillRect(x, y, 2, 2);
      }

      // update the game entities
      updateAndDrawBullets(ctx, bulletsRef);
      spawnEnemyIfNeeded(enemiesRef, lastEnemySpawnRef);
      updateAndDrawEnemies(ctx, enemiesRef, bulletsRef, scoreRef, setScore, onEnemyHit);
      drawPlayer(ctx, playerXRef.current, GAME_CONFIG.CANVAS_HEIGHT);

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameStarted, onEnemyHit, setGameOver, setGameStarted, setScore, setTimeLeft, playerXRef, bulletsRef]);

  // return the game canvas
  return (
    <canvas
    ref={canvasRef}
    width={GAME_CONFIG.CANVAS_WIDTH}
    height={GAME_CONFIG.CANVAS_HEIGHT}
    className="game-canvas"
    />
  )
}
