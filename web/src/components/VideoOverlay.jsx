import { useEffect, useRef } from 'react';
import { parsePoseControls } from '../game/gestures';

export default function VideoOverlay({
  videoRef,
  landmarkerRef,
  playerXRef,
  triggerShootRef,
}) {

  // basic refs
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const headCenterXRef = useRef(null);
  const currentStateRef = useRef('NEUTRAL');
  const lastShootTimeRef = useRef(null); // debounce shooting

  useEffect(() => {
    console.log('🎬 VideoOverlay mounted, starting processFrame loop');
    
    const processFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (!video) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      if (!canvas) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }
      
      if (!landmarker) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Check if video has actual data (width/height > 0)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        
        const results = await landmarker.detectForVideo(video, performance.now());

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];

          const { 
            bothHandsActive, 
            shouldShoot,
            gestureConfidence,
            leftHandActive,
            rightHandActive,
            currentGestureState
          } = parsePoseControls(
            landmarks,
            { headCenterXRef, playerXRef, currentStateRef, lastShootTimeRef }
          );

          if (shouldShoot) {
            console.log('🔫 SHOOT triggered!');
            triggerShootRef.current();
          }

          // Visual Debug Overlay
          const w = canvas.width;
          const h = canvas.height;
          const nose = landmarks[0];
          const leftWrist = landmarks[15];
          const rightWrist = landmarks[16];
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];

          // Draw centerline for calibration
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(w / 2, 0);
          ctx.lineTo(w / 2, h);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw head center calibration line if available
          if (headCenterXRef.current !== null) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(headCenterXRef.current * w, 0);
            ctx.lineTo(headCenterXRef.current * w, h);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Draw landmarks with better colors
          ctx.fillStyle = '#00ff00';
          ctx.beginPath();
          ctx.arc(nose.x * w, nose.y * h, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Left wrist - color changes based on if it's active
          ctx.fillStyle = leftHandActive ? '#00ffff' : '#666666';
          ctx.beginPath();
          ctx.arc(leftWrist.x * w, leftWrist.y * h, 10, 0, 2 * Math.PI);
          ctx.fill();

          // Right wrist - color changes based on if it's active  
          ctx.fillStyle = rightHandActive ? '#ff00ff' : '#666666';
          ctx.beginPath();
          ctx.arc(rightWrist.x * w, rightWrist.y * h, 10, 0, 2 * Math.PI);
          ctx.fill();

          // Draw line between wrists when both hands are up
          if (bothHandsActive) {
            ctx.strokeStyle = currentGestureState === 'LEFT_HIGH' ? '#00ffff' : 
                            currentGestureState === 'RIGHT_HIGH' ? '#ff00ff' : '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(leftWrist.x * w, leftWrist.y * h);
            ctx.lineTo(rightWrist.x * w, rightWrist.y * h);
            ctx.stroke();
          }

          // Draw shoulder reference line
          ctx.strokeStyle = '#888888';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(leftShoulder.x * w, leftShoulder.y * h);
          ctx.lineTo(rightShoulder.x * w, rightShoulder.y * h);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw status text with better formatting
          ctx.font = 'bold 16px monospace';
          
          if (bothHandsActive) {
            // Background box for text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(5, 5, 310, 80);
            
            ctx.fillStyle = '#ffff00';
            ctx.fillText('✋ HANDS UP ✋', 10, 25);
            
            ctx.font = '14px monospace';
            ctx.fillStyle = currentGestureState === 'LEFT_HIGH' ? '#00ffff' : 
                          currentGestureState === 'RIGHT_HIGH' ? '#ff00ff' : '#ffffff';
            ctx.fillText('State: ' + currentGestureState, 10, 50);
            
            // Confidence bar
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Confidence:', 10, 70);
            ctx.fillStyle = gestureConfidence > 0.7 ? '#00ff00' : 
                          gestureConfidence > 0.4 ? '#ffff00' : '#ff0000';
            ctx.fillRect(100, 58, gestureConfidence * 200, 15);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(100, 58, 200, 15);
          } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(5, 5, 250, 35);
            
            ctx.fillStyle = '#888888';
            ctx.fillText('Raise both hands up!', 10, 25);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      console.log('🛑 VideoOverlay unmounting, stopping processFrame loop');
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [videoRef, landmarkerRef, playerXRef, triggerShootRef]);

  return (
    <div className="video-pip">
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} width={320} height={240} />
    </div>
  );
}
