import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const formatNotificationTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
};

const getActivityStatusBadgeClass = (status) => {
  if (status === 'ACCEPTED') {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  }

  if (status === 'REJECTED') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }

  if (status === 'REQUEST_MORE_INFO') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }

  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
};

const buildStudentActivityPath = (notification) => {
  const params = new URLSearchParams();

  if (notification?.requestId) {
    params.set('requestId', notification.requestId);
  }

  const query = params.toString();
  return query ? `/student/notifications?${query}` : '/student/notifications';
};

const getNotificationTargetPath = (notification, userRole) => {
  if (notification?.activityType === 'room-request') {
    return buildStudentActivityPath(notification);
  }

  const rawOrderId = notification?.orderId;
  const orderId = typeof rawOrderId === 'string' ? rawOrderId : rawOrderId?._id;
  const orderQuery = orderId ? `&orderId=${encodeURIComponent(orderId)}` : '';

  if (userRole === 'student') {
    return `/restaurants?tab=orders${orderQuery}`;
  }

  if (userRole === 'shop-owner') {
    return `/shop-owner/dashboard?tab=orders${orderQuery}`;
  }

  return '/';
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    isNotificationRole,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const visibleNotifications = useMemo(
    () =>
      (Array.isArray(notifications) ? notifications : [])
        .filter((item) => item && typeof item === 'object' && item._id)
        .slice(0, 8),
    [notifications]
  );

  if (!isNotificationRole) {
    return null;
  }

  const toggleDropdown = async () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen) {
      await refreshNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification?._id) {
      return;
    }

    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    setIsOpen(false);
    navigate(getNotificationTargetPath(notification, user?.role));
  };

  const handleSeeAllClick = () => {
    setIsOpen(false);

    if (user?.role === 'student') {
      navigate('/student/notifications');
      return;
    }

    if (user?.role === 'shop-owner') {
      navigate('/shop-owner/dashboard?tab=orders');
      return;
    }

    navigate('/');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-accent transition-all duration-200 p-2 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center font-bold shadow-md">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-[70] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs inline-flex items-center gap-1 text-primary hover:text-primary-hover"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-secondary dark:text-gray-400">Loading...</div>
            ) : visibleNotifications.length > 0 ? (
              visibleNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700/70 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    notification.isRead ? 'opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {notification.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        {notification.activityType === 'room-request' && notification.status && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-full ${getActivityStatusBadgeClass(notification.status)}`}
                          >
                            {notification.status}
                          </span>
                        )}
                        {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-500"></span>}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatNotificationTime(notification.createdAt)}
                    </p>
                  </button>

                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className="text-xs font-semibold text-amber-500 hover:text-amber-600"
                    >
                      View full notification
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-sm text-secondary dark:text-gray-400">No notifications yet.</div>
            )}
          </div>

          {!loading && visibleNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-center">
              <button
                type="button"
                onClick={handleSeeAllClick}
                className="text-sm font-semibold text-amber-500 hover:text-amber-600"
              >
                See all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
