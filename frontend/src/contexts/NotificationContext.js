import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 10000;

const normalizeNotifications = (list) => {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .filter((item) => item && typeof item === 'object')
    .filter((item) => typeof item._id === 'string' && item._id.trim().length > 0);
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const previousLatestIdRef = useRef(null);

  const isNotificationRole = isAuthenticated && ['student', 'shop-owner'].includes(user?.role);

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!isNotificationRole) {
      setNotifications([]);
      setUnreadCount(0);
      previousLatestIdRef.current = null;
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await notificationAPI.getMyNotifications(20);
      const list = normalizeNotifications(response.notifications);
      const unread = response.unreadCount || 0;

      if (silent && previousLatestIdRef.current && list[0]?._id && list[0]._id !== previousLatestIdRef.current) {
        const latest = list[0];
        if (!latest.isRead) {
          toast.success(latest.title);
        }
      }

      previousLatestIdRef.current = list[0]?._id || null;
      setNotifications(list);
      setUnreadCount(unread);
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch notifications:', error);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isNotificationRole]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      return;
    }

    const response = await notificationAPI.markAsRead(notificationId);
    const updatedNotification = response.notification;

    setNotifications((prev) =>
      normalizeNotifications(prev).map((item) =>
        item._id === notificationId ? { ...item, ...updatedNotification } : item
      )
    );

    if (typeof response.unreadCount === 'number') {
      setUnreadCount(response.unreadCount);
    } else {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const response = await notificationAPI.markAllAsRead();

    setNotifications((prev) =>
      normalizeNotifications(prev).map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString()
      }))
    );

    if (typeof response.unreadCount === 'number') {
      setUnreadCount(response.unreadCount);
    } else {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (!isNotificationRole) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, isNotificationRole]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    isNotificationRole,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead
  }), [notifications, unreadCount, loading, isNotificationRole, fetchNotifications, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
