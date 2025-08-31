import React, { createContext, useEffect, useState, useContext, useRef } from 'react';
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "../components/AuthContext"

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { username } = useContext(AuthContext);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!username) return;

    const connectWebSocket = () => {
      wsRef.current = new WebSocket(`wss://autogen.aieducator.com/ws/notifications/${username}/`);

      wsRef.current.onopen = () => {
        console.log("✅ Connected to WebSocket for notifications");
      };

      wsRef.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // Expecting { type: 'homework_notification', notification: {...}, homework: {...} }
          if (msg.type === 'homework_notification') {
            const { notification, homework } = msg;

            const newNotification = {
              // Use DB notification id for mark-as-read endpoint
              id: notification?.id ?? Date.now().toString(),
              title: homework?.title || 'New Homework',
              image: homework?.attachment || '/default-homework-image.jpeg',
              message: notification?.message || 'You have a new homework update.',
              timestamp: notification?.timestamp || homework?.date_assigned || new Date().toISOString(),
              read: false,
              type: 'homework',
              homework,
              // Keep raw notification payload if needed later
              _notification: notification,
            };

            setNotifications(prev => {
              const exists = prev.some(n => n.id === newNotification.id);
              return exists ? prev : [newNotification, ...prev];
            });
          } else {
            // Handle other message types if needed
            // console.log("WS message:", msg);
          }
        } catch (err) {
          console.error("❌ Error parsing WebSocket message", err);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("❌ WebSocket error", err);
      };

      wsRef.current.onclose = () => {
        console.log("⚠ WebSocket disconnected, trying to reconnect...");
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [username]);

  // Mark a notification as read (calls WS and REST)
  const markNotificationAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    try {
      // Try WS first (optional)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'mark_read', notification_id: id }));
      }
    } catch (_) {
      // Ignore WS errors, fallback to REST below
    }

    try {
      // REST call to backend mark-as-read
      await axiosInstance.post(`/notifications/${id}/read/`);
    } catch (error) {
      console.warn('Could not mark notification as read on server:', error);
      // On failure, revert optimistic update if needed
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: false } : notif
        )
      );
    }
  };

  // Clear all notifications: mark all unread as read on server
  const clearAllNotifications = async () => {
    const unread = notifications.filter(n => !n.read);
    // Optimistic UI
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      // Sequentially or in parallel mark all as read
      await Promise.all(
        unread.map(n =>
          axiosInstance.post(`/notifications/${n.id}/read/`).catch(() => null)
        )
      );
    } catch (error) {
      console.warn('Could not clear notifications on server:', error);
      // Optional: no revert; next WS sync/refresh will correct state
    }
  };

  const getUnreadCount = () =>
    notifications.filter((notif) => !notif.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        getUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;