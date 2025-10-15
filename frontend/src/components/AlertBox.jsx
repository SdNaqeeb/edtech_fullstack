import React, { useState, useEffect } from "react";
import "./AlertBox.css";

const AlertBox = ({ message, type, onClose, autoHide = true, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isVisible) return null;

  return (
    <div className={`alert-box ${type} ${isVisible ? 'show' : 'hide'}`}>
      <span className="alert-message">{message}</span>
      <button className="close-btn" onClick={handleClose} aria-label="Close alert">
        ✖
      </button>
    </div>
  );
};

// Hook for managing alerts
export const useAlert = () => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, type = 'success', options = {}) => {
    const id = Date.now();
    const alert = {
      id,
      message,
      type,
      ...options
    };
    
    setAlerts(prev => [...prev, alert]);
    
    return id;
  };

  const hideAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const AlertContainer = () => (
    <div className="alert-container">
      {alerts.map(alert => (
        <AlertBox
          key={alert.id}
          message={alert.message}
          type={alert.type}
          onClose={() => hideAlert(alert.id)}
          autoHide={alert.autoHide}
          duration={alert.duration}
        />
      ))}
    </div>
  );

  return { showAlert, hideAlert, AlertContainer };
};

export default AlertBox;