import React, { useState, useEffect, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFire, faCalendarCheck, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from './AuthContext';
import axiosInstance from '../api/axiosInstance';
import './StreakTracker.css';

const StreakTracker = () => {
  const { username } = useContext(AuthContext);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastLoginDate: null,
    weeklyProgress: [false, false, false, false, false, false, false] // Last 7 days
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAndUpdateStreak();
  }, [username]);

  const checkAndUpdateStreak = async () => {
    try {
      const today = new Date().toDateString();
      const storedData = localStorage.getItem(`streak_${username}`);

      let currentData = {
        currentStreak: 0,
        longestStreak: 0,
        lastLoginDate: null,
        loginDates: []
      };

      if (storedData) {
        currentData = JSON.parse(storedData);
      }

      const lastLogin = currentData.lastLoginDate ? new Date(currentData.lastLoginDate).toDateString() : null;
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      // Check if user already logged in today
      if (lastLogin === today) {
        // Already logged in today, just load the data
        updateWeeklyProgress(currentData.loginDates);
        setStreakData({
          currentStreak: currentData.currentStreak,
          longestStreak: currentData.longestStreak,
          lastLoginDate: currentData.lastLoginDate,
          weeklyProgress: getWeeklyProgress(currentData.loginDates)
        });
      } else if (lastLogin === yesterday) {
        // Logged in yesterday, increment streak
        currentData.currentStreak += 1;
        currentData.lastLoginDate = new Date().toISOString();
        currentData.loginDates.push(today);

        // Update longest streak if needed
        if (currentData.currentStreak > currentData.longestStreak) {
          currentData.longestStreak = currentData.currentStreak;
        }

        // Keep only last 30 days
        if (currentData.loginDates.length > 30) {
          currentData.loginDates = currentData.loginDates.slice(-30);
        }

        localStorage.setItem(`streak_${username}`, JSON.stringify(currentData));

        setStreakData({
          currentStreak: currentData.currentStreak,
          longestStreak: currentData.longestStreak,
          lastLoginDate: currentData.lastLoginDate,
          weeklyProgress: getWeeklyProgress(currentData.loginDates)
        });

        // Optional: Send to backend
        try {
          await axiosInstance.post('/streak/', {
            username: username,
            streak: currentData.currentStreak,
            longest_streak: currentData.longestStreak
          });
        } catch (error) {
          console.error('Error updating streak on server:', error);
        }
      } else {
        // Streak broken, reset to 1
        currentData.currentStreak = 1;
        currentData.lastLoginDate = new Date().toISOString();
        currentData.loginDates = [today];

        if (currentData.longestStreak < 1) {
          currentData.longestStreak = 1;
        }

        localStorage.setItem(`streak_${username}`, JSON.stringify(currentData));

        setStreakData({
          currentStreak: currentData.currentStreak,
          longestStreak: currentData.longestStreak,
          lastLoginDate: currentData.lastLoginDate,
          weeklyProgress: getWeeklyProgress(currentData.loginDates)
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking streak:', error);
      setLoading(false);
    }
  };

  const getWeeklyProgress = (loginDates) => {
    const progress = [false, false, false, false, false, false, false];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - (6 - i));
      const checkDateString = checkDate.toDateString();

      if (loginDates && loginDates.includes(checkDateString)) {
        progress[i] = true;
      }
    }

    return progress;
  };

  const updateWeeklyProgress = (loginDates) => {
    setStreakData(prev => ({
      ...prev,
      weeklyProgress: getWeeklyProgress(loginDates)
    }));
  };

  const getDayLabel = (index) => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    return days[index];
  };

  const getStreakLevel = () => {
    const streak = streakData.currentStreak;
    if (streak >= 6) return { label: 'Legendary', color: '#FFD700', icon: '🏆' };
    if (streak >= 5) return { label: 'Expert', color: '#C0C0C0', icon: '💎' };
    if (streak >= 4) return { label: 'Master', color: '#CD7F32', icon: '⭐' };
    if (streak >= 3) return { label: 'Pro', color: '#4CAF50', icon: '🌟' };
    if (streak >= 2) return { label: 'Rising', color: '#2196F3', icon: '🔥' };
    return { label: 'Beginner', color: '#9E9E9E', icon: '🌱' };
  };

  const level = getStreakLevel();

  if (loading) {
    return (
      <div className="streak-tracker-card">
        <div className="streak-loading">Loading streak...</div>
      </div>
    );
  }

  return (
    <div className="streak-tracker-card">
      {/* Header */}
      <div className="streak-header">
        <h3>
          <FontAwesomeIcon icon={faFire} className="streak-icon" />
          Daily Streak
        </h3>
      </div>

      {/* Current Streak Display */}
      <div className="streak-current">
        <div className="streak-flame-container">
          <div className="streak-flame" style={{ color: level.color }}>
            <span className="streak-emoji">{level.icon}</span>
          </div>
          <div className="streak-number">{streakData.currentStreak}</div>
        </div>
        <p className="streak-description">Days in a row!</p>
        <div className="streak-label">{level.label}</div>
      </div>

      {/* Weekly Progress */}
      {/* <div className="streak-weekly">
        <h4>This Week</h4>
        <div className="streak-days">
          {streakData.weeklyProgress.map((completed, index) => (
            <div key={index} className="streak-day">
              <div className={`streak-day-circle ${completed ? 'completed' : ''}`}>
                {completed && <FontAwesomeIcon icon={faCalendarCheck} />}
              </div>
              <span className="streak-day-label">{getDayLabel(index)}</span>
            </div>
          ))}
        </div>
      </div> */}

      {/* Stats */}
      {/* <div className="streak-stats">
        <div className="streak-stat">
          <FontAwesomeIcon icon={faFire} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{streakData.currentStreak}</div>
            <div className="stat-label">Current</div>
          </div>
        </div>
        <div className="streak-stat-divider"></div>
        <div className="streak-stat">
          <FontAwesomeIcon icon={faTrophy} className="stat-icon" />
          <div className="stat-content">
            <div className="stat-value">{streakData.longestStreak}</div>
            <div className="stat-label">Best</div>
          </div>
        </div>
      </div> */}

      {/* Motivational Message */}
      {/* <div className="streak-motivation">
        {streakData.currentStreak === 0 && "Start your streak today!"}
        {streakData.currentStreak === 1 && "Great start! Come back tomorrow!"}
        {streakData.currentStreak >= 2 && streakData.currentStreak < 7 && "Keep it going!"}
        {streakData.currentStreak >= 7 && streakData.currentStreak < 14 && "You're on fire! 🔥"}
        {streakData.currentStreak >= 14 && streakData.currentStreak < 21 && "Amazing dedication! 💪"}
        {streakData.currentStreak >= 21 && streakData.currentStreak < 30 && "Unstoppable! 🚀"}
        {streakData.currentStreak >= 30 && "You're a legend! 🏆"}
      </div> */}
    </div>
  );
};

export default StreakTracker;
