export default function HUD({ score, timeLeft, gameStarted, leaderboard }) {
  if (!gameStarted) return null;

  return (
    <div className="score-hud">
      <div>Time: {timeLeft}s</div>
      <div>SCORE: {score}</div>
      <div className="leaderboard">
        <div>LIVE LEADERBOARD</div>
        {leaderboard.map((player, index) => <div key={player.username}>{index + 1}. {player.username}: {player.score}</div>)}
      </div>
    </div>
  );
}
