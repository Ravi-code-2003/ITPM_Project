import React, { useState, useEffect } from 'react';
import { TrendingUp, Eye, Home, Users, BarChart3 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomService, roomRequestService } from '../../services/accommodationService';

const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState({
    totalRooms: 0,
    availableRooms: 0,
    notAvailableRooms: 0,
    totalViews: 0,
    totalRequests: 0,
    mostViewedRoom: null,
    roomsWithViews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [roomsResponse, requestsResponse] = await Promise.all([
        roomService.getMyRooms(),
        roomRequestService.getOwnerRequests(),
      ]);

      const rooms = roomsResponse.data || [];
      const requests = requestsResponse.data || [];

      // Calculate analytics
      const availableRooms = rooms.filter(r => r.availability === 'AVAILABLE');
      const notAvailableRooms = rooms.filter(r => r.availability === 'NOT_AVAILABLE');
      const totalViews = rooms.reduce((sum, room) => sum + (room.viewsCount || 0), 0);

      // Find most viewed room
      const roomsWithViews = rooms
        .filter(r => r.viewsCount > 0)
        .map(r => ({
          id: r._id,
          title: r.title,
          views: r.viewsCount || 0,
          requests: requests.filter(req => req.room._id === r._id).length,
        }))
        .sort((a, b) => b.views - a.views);

      const mostViewedRoom = roomsWithViews.length > 0 ? roomsWithViews[0] : null;

      setAnalytics({
        totalRooms: rooms.length,
        availableRooms: availableRooms.length,
        notAvailableRooms: notAvailableRooms.length,
        totalViews,
        totalRequests: requests.length,
        mostViewedRoom,
        roomsWithViews: roomsWithViews.slice(0, 5), // Top 5
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary dark:text-gray-400">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Total Rooms Posted</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalRooms}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <Home className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Total Views</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalViews}
                </p>
                <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                  Across all rooms
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Requests Received</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalRequests}
                </p>
                <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                  All time
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Avg Views/Room</p>
                <p className="text-3xl font-bold text-primary dark:text-gray-100 mt-2">
                  {analytics.totalRooms > 0
                    ? Math.round(analytics.totalViews / analytics.totalRooms)
                    : 0}
                </p>
                <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                  Average engagement
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Availability Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-primary dark:text-gray-100">Available Rooms</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {analytics.availableRooms}
                </p>
                <p className="text-sm text-secondary dark:text-gray-400">
                  {analytics.totalRooms > 0
                    ? Math.round((analytics.availableRooms / analytics.totalRooms) * 100)
                    : 0}% of total
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="font-medium text-primary dark:text-gray-100">Not Available</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {analytics.notAvailableRooms}
                </p>
                <p className="text-sm text-secondary dark:text-gray-400">
                  {analytics.totalRooms > 0
                    ? Math.round((analytics.notAvailableRooms / analytics.totalRooms) * 100)
                    : 0}% of total
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Viewed Room */}
      {analytics.mostViewedRoom && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Most Viewed Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary/5 dark:to-accent/5 rounded-lg">
              <h3 className="text-xl font-bold text-primary dark:text-gray-100 mb-2">
                {analytics.mostViewedRoom.title}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Views</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {analytics.mostViewedRoom.views}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Requests</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {analytics.mostViewedRoom.requests}
                  </p>
                </div>
              </div>
              {analytics.mostViewedRoom.requests > 0 && (
                <p className="text-sm text-secondary dark:text-gray-400 mt-3">
                  Conversion rate:{' '}
                  <span className="font-semibold text-primary dark:text-accent">
                    {Math.round(
                      (analytics.mostViewedRoom.requests / analytics.mostViewedRoom.views) * 100
                    )}%
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Rooms */}
      {analytics.roomsWithViews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Performing Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.roomsWithViews.map((room, index) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-4 bg-background dark:bg-surface-dark rounded-lg border border-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 dark:bg-accent/10 rounded-full">
                      <span className="font-bold text-primary dark:text-accent">#{index + 1}</span>
                    </div>
                    <span className="font-medium text-primary dark:text-gray-100">{room.title}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-secondary dark:text-gray-400">Views</p>
                      <p className="font-bold text-primary dark:text-gray-100">{room.views}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-secondary dark:text-gray-400">Requests</p>
                      <p className="font-bold text-primary dark:text-gray-100">{room.requests}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {analytics.totalRooms === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BarChart3 className="h-16 w-16 text-secondary dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">
              No Analytics Data Yet
            </h3>
            <p className="text-secondary dark:text-gray-400">
              Start posting rooms to see your analytics and performance metrics here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
