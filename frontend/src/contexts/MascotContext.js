// src/contexts/MascotContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const MascotContext = createContext();

export const useMascot = () => {
  const context = useContext(MascotContext);
  if (!context) {
    throw new Error('useMascot must be used within a MascotProvider');
  }
  return context;
};

// Emotion types and their properties
export const EMOTIONS = {
  IDLE: {
    name: 'idle',
    color: '#3B82F6', // Blue
    message: '👋 Hi! I\'m here to help you learn!',
    duration: 5000,
  },
  HAPPY: {
    name: 'happy',
    color: '#10B981', // Green
    message: '🎉 Amazing work! You\'re doing great!',
    duration: 4000,
  },
  EXCITED: {
    name: 'excited',
    color: '#F59E0B', // Orange
    message: '⭐ Wow! Excellent performance!',
    duration: 4000,
  },
  SAD: {
    name: 'sad',
    color: '#EF4444', // Red
    message: '😊 Don\'t worry! Let\'s practice together.',
    duration: 5000,
  },
  NEUTRAL: {
    name: 'neutral',
    color: '#6366F1', // Indigo
    message: '📚 Good effort! Keep going!',
    duration: 4000,
  },
  TEACHING: {
    name: 'teaching',
    color: '#8B5CF6', // Purple
    message: '🎓 Let me explain this concept for you!',
    duration: 6000,
  },
  THINKING: {
    name: 'thinking',
    color: '#06B6D4', // Cyan
    message: '🤔 Hmm, let me think about that...',
    duration: 3000,
  },
  ENCOURAGING: {
    name: 'encouraging',
    color: '#EC4899', // Pink
    message: '💪 You can do it! Keep practicing!',
    duration: 4000,
  },
  CELEBRATING: {
    name: 'celebrating',
    color: '#10B981', // Green
    message: '🎊 Congratulations! You\'re a star!',
    duration: 5000,
  },
  WAVING: {
    name: 'waving',
    color: '#3B82F6', // Blue
    message: '👋 Welcome back! Ready to learn?',
    duration: 4000,
  },
};

export const MascotProvider = ({ children }) => {
  const [currentEmotion, setCurrentEmotion] = useState(EMOTIONS.IDLE);
  const [showMessage, setShowMessage] = useState(false);
  const [customMessage, setCustomMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-hide message after duration
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
        setCustomMessage(null);
      }, customMessage ? 6000 : currentEmotion.duration);

      return () => clearTimeout(timer);
    }
  }, [showMessage, currentEmotion, customMessage]);

  // Change emotion based on score
  const setEmotionFromScore = useCallback((score, totalMarks = 100) => {
    const percentage = (score / totalMarks) * 100;

    if (percentage >= 90) {
      setEmotion(EMOTIONS.CELEBRATING);
    } else if (percentage >= 80) {
      setEmotion(EMOTIONS.EXCITED);
    } else if (percentage >= 70) {
      setEmotion(EMOTIONS.HAPPY);
    } else if (percentage >= 60) {
      setEmotion(EMOTIONS.NEUTRAL);
    } else if (percentage >= 40) {
      setEmotion(EMOTIONS.ENCOURAGING);
    } else {
      setEmotion(EMOTIONS.SAD);
    }
  }, []);

  const setEmotion = useCallback((emotion, message = null) => {
    setCurrentEmotion(emotion);
    if (message) {
      setCustomMessage(message);
    }
    setShowMessage(true);
  }, []);

  const hideMessage = useCallback(() => {
    setShowMessage(false);
    setCustomMessage(null);
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  const showMascot = useCallback(() => {
    setIsVisible(true);
  }, []);

  const hideMascot = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Quick emotion setters
  const setIdle = useCallback(() => setEmotion(EMOTIONS.IDLE), [setEmotion]);
  const setHappy = useCallback((msg) => setEmotion(EMOTIONS.HAPPY, msg), [setEmotion]);
  const setSad = useCallback((msg) => setEmotion(EMOTIONS.SAD, msg), [setEmotion]);
  const setTeaching = useCallback((msg) => setEmotion(EMOTIONS.TEACHING, msg), [setEmotion]);
  const setThinking = useCallback(() => setEmotion(EMOTIONS.THINKING), [setEmotion]);
  const setWaving = useCallback(() => setEmotion(EMOTIONS.WAVING), [setEmotion]);
  const setCelebrating = useCallback((msg) => setEmotion(EMOTIONS.CELEBRATING, msg), [setEmotion]);
  const setEncouraging = useCallback((msg) => setEmotion(EMOTIONS.ENCOURAGING, msg), [setEmotion]);

  const value = {
    currentEmotion,
    showMessage,
    customMessage,
    isVisible,
    setEmotion,
    setEmotionFromScore,
    hideMessage,
    toggleVisibility,
    showMascot,
    hideMascot,
    // Quick setters
    setIdle,
    setHappy,
    setSad,
    setTeaching,
    setThinking,
    setWaving,
    setCelebrating,
    setEncouraging,
  };

  return (
    <MascotContext.Provider value={value}>
      {children}
    </MascotContext.Provider>
  );
};
