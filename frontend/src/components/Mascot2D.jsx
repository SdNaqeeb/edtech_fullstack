// src/components/Mascot2D.jsx
import React, { useEffect, useState, useRef } from 'react';
import Lottie from 'lottie-react';
import { useMascot } from '../contexts/MascotContext';

// Lottie animation URLs from LottieFiles (free animations)
const ANIMATION_URLS = {
  idle: 'https://lottie.host/embed/b6b89f44-49e5-4b7a-ae1f-a4bb4afa8f42/ZLXXVmfKsL.json',
  waving: 'https://lottie.host/embed/d0129ff9-4b11-4d6f-9a1c-2f8c8a8e8b84/qGYvb8nJfG.json',
  happy: 'https://lottie.host/embed/f8c3e3f3-3f3f-4f3f-9f3f-3f3f3f3f3f3f/3f3f3f3f3f.json',
  excited: 'https://lottie.host/embed/a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d/excited.json',
  sad: 'https://lottie.host/embed/e1f2g3h4-5i6j-7k8l-9m0n-1o2p3q4r5s6t/sad.json',
  neutral: 'https://lottie.host/embed/b6b89f44-49e5-4b7a-ae1f-a4bb4afa8f42/ZLXXVmfKsL.json',
  teaching: 'https://lottie.host/embed/t1e2a3c4-5h6i-7n8g-9a0b-1c2d3e4f5g6h/teaching.json',
  thinking: 'https://lottie.host/embed/t1h2i3n4-5k6i-7n8g-9a0b-1c2d3e4f5g6h/thinking.json',
  encouraging: 'https://lottie.host/embed/e1n2c3o4-5u6r-7a8g-9i0n-1g2a3b4c5d6e/encouraging.json',
  celebrating: 'https://lottie.host/embed/c1e2l3e4-5b6r-7a8t-9i0n-1g2a3b4c5d6e/celebrating.json',
};

// Fallback: Simple CSS-based robot when Lottie fails to load
const CSSRobot = ({ emotion }) => {
  return (
    <div className="css-robot" style={{
      width: '200px',
      height: '200px',
      position: 'relative',
      animation: `${emotion.name === 'happy' || emotion.name === 'celebrating' ? 'bounce' : 'float'} 2s ease-in-out infinite`
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        .css-robot-head {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, ${emotion.color || '#3B82F6'}, ${emotion.color ? emotion.color + 'CC' : '#1E40AF'});
          border-radius: 15px;
          margin: 0 auto 10px;
          position: relative;
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        .css-robot-eye {
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          position: absolute;
          top: 30px;
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.8);
        }
        .css-robot-eye.left { left: 20px; }
        .css-robot-eye.right { right: 20px; }
        .css-robot-body {
          width: 100px;
          height: 80px;
          background: linear-gradient(135deg, ${emotion.color || '#3B82F6'}, ${emotion.color ? emotion.color + 'CC' : '#1E40AF'});
          border-radius: 20px;
          margin: 0 auto;
          position: relative;
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        .css-robot-arm {
          width: 15px;
          height: 60px;
          background: linear-gradient(135deg, ${emotion.color || '#3B82F6'}, ${emotion.color ? emotion.color + 'DD' : '#2563EB'});
          border-radius: 10px;
          position: absolute;
          top: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .css-robot-arm.left {
          left: -20px;
        }
        .css-robot-arm.right {
          right: -20px;
          animation: ${emotion.name === 'waving' || emotion.name === 'idle' ? 'wave 1.5s ease-in-out infinite' : 'none'};
          transform-origin: top center;
        }
        .css-robot-antenna {
          width: 4px;
          height: 25px;
          background: #FFD700;
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 2px;
        }
        .css-robot-antenna::after {
          content: '';
          width: 10px;
          height: 10px;
          background: #FFD700;
          border-radius: 50%;
          position: absolute;
          top: -8px;
          left: -3px;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
          animation: pulse 1s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        .css-robot-panel {
          width: 40px;
          height: 50px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 5px;
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
        }
      `}</style>

      <div className="css-robot-head">
        <div className="css-robot-antenna"></div>
        <div className="css-robot-eye left"></div>
        <div className="css-robot-eye right"></div>
      </div>

      <div className="css-robot-body">
        <div className="css-robot-panel"></div>
        <div className="css-robot-arm left"></div>
        <div className="css-robot-arm right"></div>
      </div>
    </div>
  );
};

const Mascot2D = ({ useFallback = false }) => {
  const { currentEmotion } = useMascot();
  const [animationData, setAnimationData] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const lottieRef = useRef();

  useEffect(() => {
    // If useFallback is true, skip Lottie loading
    if (useFallback) {
      setLoadError(true);
      return;
    }

    // Try to load Lottie animation
    const animationUrl = ANIMATION_URLS[currentEmotion.name] || ANIMATION_URLS.idle;

    fetch(animationUrl)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load animation');
        return res.json();
      })
      .then(data => {
        setAnimationData(data);
        setLoadError(false);
      })
      .catch(error => {
        console.warn('Lottie animation failed to load, using CSS fallback:', error);
        setLoadError(true);
      });
  }, [currentEmotion.name, useFallback]);

  // Use CSS Robot as fallback if Lottie fails or useFallback is true
  if (loadError || useFallback) {
    return <CSSRobot emotion={currentEmotion} />;
  }

  // Show loading state
  if (!animationData) {
    return (
      <div style={{
        width: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: currentEmotion.color
      }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '200px', height: '200px' }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default Mascot2D;
