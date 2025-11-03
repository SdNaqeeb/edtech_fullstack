import React, { useContext, useState } from 'react';
import { Dropdown, Badge, Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { NotificationContext } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const NotificationDropdown = () => {
  const {
    notifications = [],
    markNotificationAsRead,
    clearAllNotifications,
    getUnreadCount,
  } = useContext(NotificationContext);

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [loadingOldNotifications, setLoadingOldNotifications] = useState(false);
  const [oldNotificationsLoaded, setOldNotificationsLoaded] = useState(false);
  const navigate = useNavigate();

  const unreadCount = getUnreadCount();

  // Show only old notifications when loaded, otherwise show current notifications
  const allNotifications = oldNotificationsLoaded
    ? oldNotifications
    : notifications;

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

  // Fetch old notifications
  const fetchOldNotifications = async () => {
    setLoadingOldNotifications(true);
    try {
      const response = await axiosInstance.get('studentnotifications/');
      setOldNotifications(response.data);
      setOldNotificationsLoaded(true);
    } catch (error) {
      console.error('Error fetching old notifications:', error);
    } finally {
      setLoadingOldNotifications(false);
    }
  };

  // Handle dropdown toggle (clear old notifications when closed)
  const handleDropdownToggle = (isOpen) => {
    if (!isOpen) {
      // Dropdown is closing, clear old notifications
      setOldNotifications([]);
      setOldNotificationsLoaded(false);
    }
  };

  const handleNotificationClick = (notification) => {
    console.log("Notification clicked:", notification);
    // Mark notification as read
    markNotificationAsRead(notification.id);

    // Determine if this is a homework notification and get the notification ID
    const isHomeworkNotification =
      (notification.type === 'homework' && notification._notification?.id) || // New format
      notification.homework; // Old format

    if (isHomeworkNotification) {
      // Get notification ID based on format
      const notificationId = notification._notification?.id || notification.id;

      console.log("Navigating to homework submission with notification ID:", notificationId);

      navigate('/homework', {
        state: {
          notificationId: notificationId,
        }
      });
    } else {
      // For other notifications, show the modal
      setSelectedNotification(notification);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  return (
    <>
      <Dropdown align="end" className="position-relative" onToggle={handleDropdownToggle}>
        <Dropdown.Toggle
          variant="link"
          id="notifications-dropdown"
          className="nav-link position-relative"
        >
          <FontAwesomeIcon icon={faBell} size="lg" /> Notifications
          {unreadCount > 0 && (
            <Badge

              bg="danger"
              className="position-absolute top-10 start-1 translate-down p-1"
              style={{ fontSize: '0.7rem' }}
            >
              {unreadCount}
            </Badge>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu className="notification-menu" style={{ minWidth: '300px', maxHeight: '400px', overflow: 'auto' }}>
          <Dropdown.Header className="d-flex justify-content-between align-items-center">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <button
                type="button"
                className="btn btn-link p-0 text-primary"
                onClick={clearAllNotifications}
                style={{ fontSize: '0.85rem' }}
              >
                Clear All
              </button>
            )}
          </Dropdown.Header>

          {/* Old Notifications Button */}
          {!oldNotificationsLoaded && (
            <div className="px-3 py-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary w-100"
                onClick={fetchOldNotifications}
                disabled={loadingOldNotifications}
              >
                {loadingOldNotifications ? 'Loading...' : 'Load Old Notifications'}
              </button>
            </div>
          )}

          {allNotifications.length === 0 ? (
            <Dropdown.Item disabled>No notifications</Dropdown.Item>
          ) : (
            allNotifications.map((notification) => (
              <Dropdown.Item
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={!notification.read ? 'unread-notification' : ''}
              >
                <div className="d-flex align-items-start">
                  <span className="me-2" style={{ fontSize: '1.2rem' }}>
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div>
                    {/* <div className="fw-bold">{notification.title}</div> */}
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {notification.message}
                      
                    </div>

                    
                    <small className="text-muted">
                      {new Date(notification.timestamp).toLocaleString()}
                    </small>
                  </div>
                </div>
              </Dropdown.Item>
            ))
          )}
        </Dropdown.Menu>
      </Dropdown>

      {/* Modal for showing non-homework notification details */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedNotification?.title || 'Notification Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Message:</strong> {selectedNotification?.message}</p>
          <p>
            <strong>Date:</strong>{' '}
            {selectedNotification?.timestamp
              ? new Date(selectedNotification.timestamp).toLocaleString()
              : 'N/A'}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default NotificationDropdown;