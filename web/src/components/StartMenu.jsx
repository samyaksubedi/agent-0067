import { useState } from 'react';
import GestureTutorial from './GestureTutorial';
export default function StartMenu({ isModelReady, isRunning, errorMsg, onStartCamera, onStartGame }) {
  const [showTutorial, setShowTutorial] = useState(false);
  return (
    <>
      {showTutorial && <GestureTutorial onClose={() => setShowTutorial(false)} />}
      
      <div className="start-overlay">
        <img src="/logo.png" alt="Agent 67" style={{ width: '120px', height: '120px', marginBottom: '20px' }} />
        <h2>🕵️ AGENT 67</h2>
        <div className="instructions">
          <p><strong>SHOOT:</strong> Six-Seven </p>
          <p><strong>MOVE:</strong> Tilt head left or right</p>
        </div>  

        <button 
          onClick={onStartCamera} 
          disabled={!isModelReady || isRunning} 
          className="start-game-btn"
        >
          {!isModelReady ? 'Loading Model...' : isRunning ? 'Camera Ready' : 'Start Camera'}
        </button>

        {isRunning && (
          <div>
            <button onClick={onStartGame} className="start-game-btn" style={{ marginTop: '10px' }}>
              START MISSION
            </button>
            <button 
              onClick={() => setShowTutorial(true)} 
              className="start-game-btn" 
              style={{ marginTop: '10px', backgroundColor: '#ffaa00' }}
            >
              📖 How to Play
            </button>
          </div>
        )}

        {errorMsg && <div className="error">{errorMsg}</div>}
      </div>
    </>
  );
}
