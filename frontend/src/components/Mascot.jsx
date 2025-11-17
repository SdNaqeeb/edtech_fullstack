// src/components/Mascot.jsx
import React, { useState } from 'react';
import { useMascot } from '../contexts/MascotContext';
import './Mascot.css';
import MascotCSS from './MascotCSS';

const Mascot = ({ position = 'bottom-right' }) => {
  const {
    currentEmotion,
    showMessage,
    customMessage,
    isVisible,
    toggleVisibility,
  } = useMascot();

  if (!isVisible) {
    return (
      <button
        className="mascot-toggle-floating"
        onClick={toggleVisibility}
        title="Show Helper"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="mascot-floating-container">
      {/* Hide Button */}
      <button
        className="mascot-hide-btn"
        onClick={toggleVisibility}
        title="Hide Mascot"
      >
        ✕
      </button>

      {/* Mascot */}
      {/* <MascotCSS /> */}

      {/* Speech Bubble */}
      {showMessage && (
        <div className="mascot-speech-bubble-floating" style={{ borderColor: currentEmotion.color }}>
          <div className="speech-content">
            {customMessage || currentEmotion.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mascot;
