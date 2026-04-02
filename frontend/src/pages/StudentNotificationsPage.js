import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, CheckCircle, Clock, MapPin, XCircle } from 'lucide-react';
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { useNotifications } from '../contexts/NotificationContext';

const getStatusBadgeClass = (status) => {
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

const getStatusIcon = (status) => {
  if (status === 'ACCEPTED') {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  }

  if (status === 'REJECTED') {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }

  if (status === 'REQUEST_MORE_INFO') {
    return <Clock className="h-5 w-5 text-amber-500" />;
  }

  return <Clock className="h-5 w-5 text-yellow-500" />;
};

const formatDate = (dateString) => {
  if (!dateString) {
    return '-';
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const StudentNotificationsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedRequestId = searchParams.get('requestId');

  const {
    notifications,
    loading,
    refreshNotifications
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Recent Activities</h1>
          <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">
            View all of your accommodation notification updates
          </p>
        </div>

        <Card>
          <CardHeader className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>
                Latest updates are listed below
              </CardDescription>
            </div>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors shadow-sm"
            >
              Back to dashboard
            </Link>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-10 w-10 mx-auto text-secondary/60 dark:text-gray-500 mb-3" />
                <p className="text-secondary dark:text-gray-400">No notifications found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const rowStatus = notification.status || 'PENDING';
                  const isSelected = highlightedRequestId && notification.requestId === highlightedRequestId;

                  return (
                    <div
                      key={notification._id}
                      className={`rounded-lg border border-secondary/20 dark:border-gray-700 p-4 transition-colors ${
                        isSelected ? 'bg-accent/10 ring-2 ring-primary/30' : 'hover:bg-accent/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {notification.activityType === 'room-request'
                            ? getStatusIcon(rowStatus)
                            : <Bell className="h-5 w-5 text-primary dark:text-accent" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className="font-medium text-primary dark:text-gray-100 truncate">
                              {notification.title}
                            </p>
                            {notification.activityType === 'room-request' && (
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(rowStatus)}`}>
                                {rowStatus}
                              </span>
                            )}
                          </div>

                          {notification.message && (
                            <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                          )}

                          {notification.activityType === 'room-request' && notification.message?.includes('•') && (
                            <div className="flex items-center text-xs text-secondary dark:text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              {notification.message.split('•')[0].trim()}
                            </div>
                          )}

                          <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentNotificationsPage;
