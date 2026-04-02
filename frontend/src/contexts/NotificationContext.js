import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationAPI } from '../services/api';
import { roomRequestService } from '../services/accommodationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 10000;

const buildStudentActivityNotifications = (requests = []) => {
  return requests.map((request) => {
    const roomTitle = request.room?.title || 'Room inquiry';
    const area = request.room?.location?.area;
    const status = request.status || 'PENDING';

    const statusTitleMap = {
      ACCEPTED: 'Request accepted',
      REJECTED: 'Request rejected',
      REQUEST_MORE_INFO: 'More information requested',
      PENDING: 'Request submitted',
      CANCELLED: 'Request cancelled'
    };

    const messageParts = [];
    if (area) messageParts.push(area);
    if (request.ownerResponse?.responseMessage) messageParts.push(`Owner: ${request.ownerResponse.responseMessage}`);

    return {
      _id: `activity-${request._id}`,
      title: `${statusTitleMap[status] || 'Request update'} - ${roomTitle}`,
      message: messageParts.join(' • ') || `Status: ${status}`,
      createdAt: request.updatedAt || request.createdAt || new Date().toISOString(),
      isRead: true,
      activityType: 'room-request',
      status,
      requestId: request._id
    };
  });
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

      let mergedNotifications = list;
      if (user?.role === 'student') {
        const studentRequestsResponse = await roomRequestService.getStudentRequests();
        const studentRequests = studentRequestsResponse?.data || [];
        const activityNotifications = buildStudentActivityNotifications(studentRequests);

        mergedNotifications = [...activityNotifications, ...list]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (silent && previousLatestIdRef.current && list[0]?._id && list[0]._id !== previousLatestIdRef.current) {
        const latest = list[0];
        if (!latest.isRead) {
          toast.success(latest.title);
        }
      }

      previousLatestIdRef.current = list[0]?._id || null;
      setNotifications(mergedNotifications);
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
