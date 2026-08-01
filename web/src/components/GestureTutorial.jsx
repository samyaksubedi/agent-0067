
export default function GestureTutorial({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      padding: '20px',
      overflow: 'auto'
    }}>
      <div style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', color: '#00ff00' }}>
          🎮 How to Shoot: The "Six-Seven" Gesture
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '30px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <div style={{ 
            padding: '20px', 
            backgroundColor: 'rgba(0, 255, 255, 0.1)',
            border: '2px solid #00ffff',
            borderRadius: '10px'
          }}>
            <h2 style={{ color: '#00ffff', fontSize: '1.5rem' }}>1️⃣ Left Hand High</h2>
            <div style={{ fontSize: '5rem', textAlign: 'center', margin: '20px 0' }}>
              🤚👇
            </div>
            <p style={{ fontSize: '1.1rem' }}>
              Raise your <strong>LEFT</strong> hand higher than your right.
              <br/>
              <span style={{ color: '#00ffff' }}>● Cyan line shows left is higher</span>
            </p>
          </div>

          <div style={{ 
            padding: '20px', 
            backgroundColor: 'rgba(255, 0, 255, 0.1)',
            border: '2px solid #ff00ff',
            borderRadius: '10px'
          }}>
            <h2 style={{ color: '#ff00ff', fontSize: '1.5rem' }}>2️⃣ Right Hand High</h2>
            <div style={{ fontSize: '5rem', textAlign: 'center', margin: '20px 0' }}>
              👇🤚
            </div>
            <p style={{ fontSize: '1.1rem' }}>
              Raise your <strong>RIGHT</strong> hand higher than your left.
              <br/>
              <span style={{ color: '#ff00ff' }}>● Magenta line shows right is higher</span>
            </p>
          </div>
        </div>

        <div style={{
          padding: '25px',
          backgroundColor: 'rgba(255, 255, 0, 0.1)',
          border: '3px solid #ffff00',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h2 style={{ color: '#ffff00', fontSize: '2rem', marginBottom: '15px' }}>
            🔫 To SHOOT: Switch Between Positions!
          </h2>
          <p style={{ fontSize: '1.3rem', lineHeight: '1.8' }}>
            Left high → Right high = <strong style={{ color: '#00ff00' }}>BANG!</strong>
            <br/>
            Right high → Left high = <strong style={{ color: '#00ff00' }}>BANG!</strong>
          </p>
        </div>

        <div style={{ marginBottom: '30px', textAlign: 'left' }}>
          <h3 style={{ color: '#00ff00', fontSize: '1.5rem', marginBottom: '15px' }}>
            ✅ Tips for Success:
          </h3>
          <ul style={{ fontSize: '1.1rem', lineHeight: '2' }}>
            <li>Keep <strong>BOTH hands above your shoulders</strong> at all times</li>
            <li>Make the height difference <strong>BIG</strong> (6-8 inches minimum)</li>
            <li>Use <strong>exaggerated movements</strong> - bigger is better!</li>
            <li>Watch the <strong>confidence bar</strong> - aim for green!</li>
            <li>Stand <strong>3-5 feet</strong> from the camera</li>
          </ul>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#ff6666', fontSize: '1.5rem', marginBottom: '15px' }}>
            🎯 Head Movement = Player Movement
          </h3>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
            Tilt your head <strong>left</strong> to move left<br/>
            Tilt your head <strong>right</strong> to move right<br/>
            <em style={{ color: '#888' }}>Your character follows your head position!</em>
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '15px 40px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            backgroundColor: '#00ff00',
            color: '#000',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 255, 0, 0.5)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          Got it! Let's Play 🚀
        </button>
      </div>
    </div>
  );
}
