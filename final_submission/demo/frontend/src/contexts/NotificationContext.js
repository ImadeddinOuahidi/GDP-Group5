import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { tokenManager } from '../services/apiClient';

const NotificationContext = createContext(null);

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef(null);

  // Fetch existing notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const token = tokenManager.getToken();
      if (!token || token.startsWith('demo-token')) return;

      const response = await fetch(`${BASE_URL}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications || []);
          setUnreadCount(data.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    const token = tokenManager.getToken();
    if (!token || token.startsWith('demo-token')) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Use EventSource with token in URL (SSE doesn't support custom headers)
      const url = `${BASE_URL}/notifications/stream`;
      const eventSource = new EventSource(url, { withCredentials: false });
      
      // Note: Standard EventSource doesn't support auth headers.
      // For production, use a polyfill or fetch-based SSE.
      // For this implementation, we'll use polling as a fallback.
      
      eventSource.addEventListener('connected', () => {
        setConnected(true);
        console.log('[Notifications] SSE connected');
      });

      eventSource.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications((prev) => [notification, ...prev.slice(0, 19)]);
          setUnreadCount((prev) => prev + 1);

          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/logo192.png',
              tag: notification.id,
            });
          }
        } catch (err) {
          console.error('[Notifications] Parse error:', err);
        }
      });

      eventSource.onerror = () => {
        setConnected(false);
        eventSource.close();
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000);
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('[Notifications] SSE connection failed:', err);
      // Fallback: poll every 30 seconds
      setConnected(false);
    }
  }, []);

  // Polling fallback for notifications (every 30 seconds)
  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token || token.startsWith('demo-token')) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = tokenManager.getToken();
      if (!token) return;

      await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId || n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date() }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = tokenManager.getToken();
      if (!token) return;

      await fetch(`${BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    connected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
