// src/components/MascotCSS.jsx
import React from 'react';
import { useMascot } from '../contexts/MascotContext';
import './MascotCSS.css';

const MascotCSS = () => {
  const { currentEmotion } = useMascot();
  const emotionName = currentEmotion.name;
  const emotionColor = currentEmotion.color || '#6366F1';

  return (
    <div className="cute-mascot-container">
      <div className={`cute-robot emotion-${emotionName}`}>
        {/* Glow Effect */}
        <div className="robot-glow" style={{ backgroundColor: emotionColor }}></div>

        {/* Sparkles for happy emotions */}
        {(emotionName === 'happy' || emotionName === 'celebrating' || emotionName === 'excited') && (
          <div className="sparkles">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`sparkle sparkle-${i + 1}`}>✨</div>
            ))}
          </div>
        )}

        {/* Antenna with cute tip */}
        {/* <div className="cute-antenna">
          <div className="antenna-wire"></div>
          <div className="antenna-ball" style={{ backgroundColor: '#FFD700', boxShadow: `0 0 20px #FFD700` }}>
            <div className="antenna-pulse"></div>
          </div>
        </div> */}

        {/* Head - Big and Round */}
        <div className="cute-head" style={{ background: `linear-gradient(135deg, ${emotionColor}, ${emotionColor}dd)` }}>
          {/* Cheek Blushes */}
          <div className="cheek cheek-left"></div>
          <div className="cheek cheek-right"></div>

          {/* Eyes - Big and Expressive */}
          <div className="cute-eyes">
            <div className={`cute-eye eye-left ${emotionName}`}>
              <div className="eye-white"></div>
              <div className="pupil">
                <div className="eye-shine"></div>
              </div>
            </div>
            <div className={`cute-eye eye-right ${emotionName}`}>
              <div className="eye-white"></div>
              <div className="pupil">
                <div className="eye-shine"></div>
              </div>
            </div>
          </div>

          {/* Mouth - Cute and Expressive */}
          <div className={`cute-mouth mouth-${emotionName}`}>
            {emotionName === 'happy' || emotionName === 'celebrating' || emotionName === 'excited' ? (
              <div className="smile-big">
                <div className="smile-curve"></div>
                <div className="smile-tooth smile-tooth-1"></div>
                <div className="smile-tooth smile-tooth-2"></div>
              </div>
            ) : emotionName === 'sad' ? (
              <div className="mouth-sad"> </div>
            ) : emotionName === 'thinking' ? (
              <div className="mouth-thinking">🤔</div>
            ) : emotionName === 'waving' ? (
              <div className="mouth-wave">◡</div>
            ) : (
              <div className="mouth-neutral"></div>
            )}
          </div>
        </div>

        {/* Body - Chubby and Round */}
        <div className="cute-body" style={{ background: `linear-gradient(180deg, ${emotionColor}, ${emotionColor}cc)` }}>
          {/* Heart Display */}
          <div className="heart-display">
            {/* <div className="heart-icon" style={{ color: emotionColor }}>❤️</div> */}
            <div className="heart-beat-line">
              <svg viewBox="0 0 100 30" className="beat-svg">
                <polyline points="0,15 20,15 25,5 30,25 35,15 100,15"
                          fill="none"
                          stroke="#00ffff"
                          strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Energy Level Bar */}
          <div className="energy-bar">
            <div className="energy-fill" style={{ background: `linear-gradient(90deg, ${emotionColor}, #00ffff)` }}></div>
          </div>
        </div>

        {/* Arms - Cute and Stumpy */}
        <div className={`cute-arm arm-left ${emotionName}`} style={{ background: `linear-gradient(180deg, ${emotionColor}, ${emotionColor}dd)` }}>
          <div className="cute-hand">
            <div className="finger"></div>
            <div className="finger"></div>
            <div className="finger"></div>
          </div>
        </div>
        <div className={`cute-arm arm-right ${emotionName}`} style={{ background: `linear-gradient(180deg, ${emotionColor}, ${emotionColor}dd)` }}>
          <div className="cute-hand">
            <div className="finger"></div>
            <div className="finger"></div>
            <div className="finger"></div>
          </div>
        </div>

        {/* Legs - Short and Cute */}
        <div className="cute-legs">
          <div className="cute-leg leg-left" style={{ backgroundColor: emotionColor }}>
            <div className="cute-foot">
              <div className="shoe-detail"></div>
            </div>
          </div>
          <div className="cute-leg leg-right" style={{ backgroundColor: emotionColor }}>
            <div className="cute-foot">
              <div className="shoe-detail"></div>
            </div>
          </div>
        </div>

        {/* Shadow */}
        <div className="cute-shadow"></div>
      </div>
    </div>
  );
};

export default MascotCSS;
