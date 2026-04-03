import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, MapPin, XCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomRequestService } from '../../services/accommodationService';

const normalizeRequests = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object');
};

const StudentDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await roomRequestService.getStudentRequests();
        setRequests(normalizeRequests(response.data));
      } catch (error) {
        console.error('Failed to fetch requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const getStatusIcon = (status) => {
    if (status === 'ACCEPTED') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="h-5 w-5 text-red-500" />;
    return <Clock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = (status) => {
    if (status === 'ACCEPTED') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">Explore services and opportunities</p>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : requests.length === 0 ? (
              <p className="text-secondary dark:text-gray-400">Your recent activity and recommendations will appear here.</p>
            ) : (
              <div className="space-y-4">
                {normalizeRequests(requests).slice(0, 5).map((request, index) => (
                  <div
                    key={request._id || `request-${index}`}
                    className="flex items-start gap-4 p-4 rounded-lg border border-secondary/20 dark:border-gray-700 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-primary dark:text-gray-100 truncate">
                          {request.room?.title || 'Room Inquiry'}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      {request.room?.location?.area && (
                        <div className="flex items-center text-sm text-secondary dark:text-gray-400 mt-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          {request.room.location.area}
                        </div>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.responseMessage && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Owner: "{request.ownerResponse.responseMessage}"
                        </p>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.availableVisitingTimes && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Visiting times: {request.ownerResponse.availableVisitingTimes}
                        </p>
                      )}
                      {request.status === 'ACCEPTED' && request.ownerResponse?.preferredContactMethod && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          Contact via: {request.ownerResponse.preferredContactMethod}
                        </p>
                      )}
                      <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                        {new Date(request.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
                {requests.length > 5 && (
                  <p className="text-sm text-secondary dark:text-gray-400 text-center pt-2">
                    And {requests.length - 5} more inquiry{requests.length - 5 > 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
