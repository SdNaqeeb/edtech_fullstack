import React, { useContext, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { NotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './LiveNotifications.css';

const LiveNotifications = () => {
  const {
    notifications = [],
    markNotificationAsRead,
    clearAllNotifications,
    getUnreadCount,
  } = useContext(NotificationContext);

  const [showOldNotifications, setShowOldNotifications] = useState(false);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [loadingOldNotifications, setLoadingOldNotifications] = useState(false);
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  // Show recent notifications (last 5) or all when expanded
  const displayNotifications = showOldNotifications ? oldNotifications : notifications.slice(0, 5);

  const getNotificationIcon = (type) => {
    const iconMap = {
      achievement: '🏆',
      progress: '📈',
      recommendation: '💡',
      reminder: '⏰',
      homework: '📖'
    };
    return iconMap[type] || '🔔';
  };

  const fetchOldNotifications = async () => {
    setLoadingOldNotifications(true);
    try {
      const response = await axiosInstance.get('studentnotifications/');
      setOldNotifications(response.data);
      setShowOldNotifications(true);
    } catch (error) {
      console.error('Error fetching old notifications:', error);
    } finally {
      setLoadingOldNotifications(false);
    }
  };

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification);

    // Mark notification as read
    markNotificationAsRead(notification.id);

    // Determine if this is a homework notification
    const isHomeworkNotification =
      (notification.type === 'homework' && notification._notification?.id) ||
      notification.homework;

    if (isHomeworkNotification) {
      const notificationId = notification._notification?.id || notification.id;
      console.log("Navigating to homework submission with notification ID:", notificationId);

      navigate('/homework', {
        state: {
          notificationId: notificationId,
        }
      });
    }
  };

  const handleDismiss = (notificationId, e) => {
    e.stopPropagation();
    markNotificationAsRead(notificationId);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="live-notifications-card">
      {/* Header */}
      <div className="live-notifications-header">
        <h3>
          <FontAwesomeIcon icon={faBell} className="notifications-icon" />
          Notifications
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h3>
        {/* {notifications.length > 0 && (
          <button
            className="clear-all-btn"
            onClick={clearAllNotifications}
            title="Clear all"
          >
            Clear All
          </button>
        )} */}
      </div>

      {/* Notifications List */}
      <div className="live-notifications-list">
        {displayNotifications.length === 0 ? (
          <div className="no-notifications">
            <FontAwesomeIcon icon={faCheckCircle} className="no-notif-icon" />
            <p>No new notifications</p>
            <span>You're all caught up!</span>
          </div>
        ) : (
          <>
            {displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon-wrapper">
                  <span className="notification-emoji">
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                <div className="notification-content">
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div className="notification-time">
                    {formatTimestamp(notification.timestamp)}
                  </div>
                </div>
                {/* <button
                  className="notification-dismiss"
                  onClick={(e) => handleDismiss(notification.id, e)}
                  title="Dismiss"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button> */}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Load More Button */}
      {!showOldNotifications && notifications.length > 5 && (
        <div className="load-more-wrapper">
          <button
            className="load-more-btn"
            onClick={fetchOldNotifications}
            disabled={loadingOldNotifications}
          >
            {loadingOldNotifications ? 'Loading...' : `View All (${notifications.length})`}
          </button>
        </div>
      )}

      {/* Show Recent Button (when old notifications are shown) */}
      {showOldNotifications && (
        <div className="load-more-wrapper">
          <button
            className="load-more-btn"
            onClick={() => setShowOldNotifications(false)}
          >
            Show Recent Only
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveNotifications;
