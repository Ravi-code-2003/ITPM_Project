import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Home, Store, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { roomRequestService } from '../../services/accommodationService';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await roomRequestService.getStudentRequests();
        setRequests(response.data || []);
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
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
            <p className="text-secondary dark:text-gray-400 mt-2">Explore services and opportunities</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-accent/20 p-3 rounded-lg">
                  <BookOpen className="h-8 w-8 text-primary dark:text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Education Programs</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 mb-4">Discover courses and learning opportunities</p>
              <Button className="w-full" onClick={() => navigate('/education-programs')}>
                Browse Programs
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <Home className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Accommodation</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 mb-4">Find student housing near campus</p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                onClick={() => navigate('/accommodation')}
              >
                Find Housing
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-soft-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Store className="h-8 w-8 text-primary dark:text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Campus Shops</h3>
              </div>
              <p className="text-secondary dark:text-gray-400 mb-4">Explore local businesses and services</p>
              <Button className="w-full" onClick={() => navigate('/restaurants')}>
                Browse Shops
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
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
                {requests.slice(0, 5).map((request) => (
                  <div
                    key={request._id}
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