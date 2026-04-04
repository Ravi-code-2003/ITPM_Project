import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { notificationAPI } from '../services/api';
import { roomRequestService } from '../services/accommodationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_INTERVAL_MS = 10000;
const READ_ACTIVITY_STORAGE_KEY = 'studentReadActivityIds';

const getStoredReadActivityIds = () => {
  if (typeof window === 'undefined') {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(READ_ACTIVITY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const persistReadActivityIds = (ids) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(READ_ACTIVITY_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage failures (private mode/quota) and keep in-memory state.
  }
};

const normalizeNotifications = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object');
};

const buildActivityVersionId = (request = {}) => {
  const requestId = request?._id || 'unknown';
  const status = request?.status || 'PENDING';
  const versionSource = request?.updatedAt || request?.ownerResponse?.updatedAt || request?.createdAt || status;
  const version = encodeURIComponent(String(versionSource));
  return `activity-${requestId}-${status}-${version}`;
};

const buildStudentActivityNotifications = (requests = [], readActivityIds = new Set()) => {
  return requests.map((request) => {
    const activityId = buildActivityVersionId(request);
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
      _id: activityId,
      title: `${statusTitleMap[status] || 'Request update'} - ${roomTitle}`,
      message: messageParts.join(' • ') || `Status: ${status}`,
      createdAt: request.updatedAt || request.createdAt || new Date().toISOString(),
      isRead: readActivityIds.has(activityId),
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
  const [readActivityIds, setReadActivityIds] = useState(() => getStoredReadActivityIds());
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
      const serverUnread = typeof response.unreadCount === 'number'
        ? response.unreadCount
        : list.filter((item) => !item.isRead).length;

      let mergedNotifications = list;
      let activityUnread = 0;
      if (user?.role === 'student') {
        const studentRequestsResponse = await roomRequestService.getStudentRequests();
        const studentRequests = studentRequestsResponse?.data || [];
        const activityNotifications = buildStudentActivityNotifications(studentRequests, readActivityIds);

        activityUnread = activityNotifications.filter((item) => !item.isRead).length;

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
      setUnreadCount(serverUnread + activityUnread);
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch notifications:', error);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isNotificationRole, readActivityIds, user?.role]);

  const markAsRead = useCallback(async (notificationId) => {
    if (!notificationId) {
      return;
    }

    if (notificationId.startsWith('activity-')) {
      setNotifications((prev) =>
        normalizeNotifications(prev).map((item) =>
          item._id === notificationId ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
        )
      );

      setReadActivityIds((prev) => {
        if (prev.has(notificationId)) {
          return prev;
        }

        const next = new Set(prev);
        next.add(notificationId);
        persistReadActivityIds(next);
        return next;
      });

      setUnreadCount((prev) => Math.max(0, prev - 1));
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
    const activityIds = normalizeNotifications(notifications)
      .map((item) => item?._id)
      .filter((id) => typeof id === 'string' && id.startsWith('activity-'));

    const response = await notificationAPI.markAllAsRead();

    setNotifications((prev) =>
      normalizeNotifications(prev).map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString()
      }))
    );

    if (activityIds.length > 0) {
      setReadActivityIds((prev) => {
        const next = new Set(prev);
        activityIds.forEach((id) => next.add(id));
        persistReadActivityIds(next);
        return next;
      });
    }

    if (typeof response.unreadCount === 'number') {
      setUnreadCount(0);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);

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
