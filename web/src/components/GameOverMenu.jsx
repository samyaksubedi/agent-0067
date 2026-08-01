export default function GameOverMenu({ finalScore }) {
  return (
    <div className="game-over-screen">
      <h2>MISSION COMPLETE!</h2>
      <div className="final-stats">
        <p>FINAL SCORE: {finalScore}</p>
        <p>ENEMIES DESTROYED: {Math.floor(finalScore / 10)}</p>
        <p> NICEEE  MORE 6-7</p>
      </div>
    </div>
  );
}
