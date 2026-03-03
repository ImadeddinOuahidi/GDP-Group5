import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { tokenManager } from '../services/apiClient';

const NotificationContext = createContext(null);

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const abortControllerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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

  // Connect to SSE stream using fetch (supports auth headers)
  const connectSSE = useCallback(async () => {
    const token = tokenManager.getToken();
    if (!token || token.startsWith('demo-token')) return;

    // Close existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(`${BASE_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      setConnected(true);
      console.log('[Notifications] SSE connected via fetch');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (eventType === 'notification' && dataStr) {
              try {
                const notification = JSON.parse(dataStr);
                setNotifications((prev) => [notification, ...prev.slice(0, 19)]);
                setUnreadCount((prev) => prev + 1);

                // Show browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new window.Notification(notification.title || 'New Notification', {
                    body: notification.message,
                    icon: '/logo192.png',
                    tag: notification._id || notification.id,
                  });
                }
              } catch (err) {
                // ignore non-JSON heartbeat data
              }
            }
            eventType = '';
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return; // intentional disconnect
      console.warn('[Notifications] SSE error, falling back to polling:', err.message);
      setConnected(false);
      // Reconnect after 10 seconds
      reconnectTimeoutRef.current = setTimeout(connectSSE, 10000);
    }
  }, []);

  // Start SSE connection + polling fallback
  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token || token.startsWith('demo-token')) return;

    fetchNotifications();
    connectSSE();

    // Polling fallback as a safety net (every 30 seconds)
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [fetchNotifications, connectSSE]);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Cleanup on unmount is handled by the useEffect above

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
