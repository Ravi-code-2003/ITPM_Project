import React, { useState, useEffect } from 'react';
import { Home, Users, Gift, MapPin, Eye, BarChart3 } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import { roomService, roomRequestService, roomOfferService } from '../../services/accommodationService';
import RoomListingsTab from '../../Component/Accommodation/RoomListingsTab';
import RequestsManagementTab from '../../Component/Accommodation/RequestsManagementTab';
import OffersPromotionsTab from '../../Component/Accommodation/OffersPromotionsTab';
import AnalyticsTab from '../../Component/Accommodation/AnalyticsTab';

const HouseOwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('listings');
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    pendingRequests: 0,
    activeOffers: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const [roomsResponse, requestsResponse, offersResponse] = await Promise.all([
        roomService.getMyRooms(),
        roomRequestService.getOwnerRequests(),
        roomOfferService.getMyOffers(),
      ]);

      const rooms = roomsResponse.data || [];
      const requests = requestsResponse.data || [];
      const offers = offersResponse.data || [];

      const availableRooms = rooms.filter(r => r.availability === 'AVAILABLE').length;
      const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
      const activeOffers = offers.filter(o => {
        const now = new Date();
        return o.isActive && new Date(o.validTo) >= now;
      }).length;
      const totalViews = rooms.reduce((sum, room) => sum + (room.viewsCount || 0), 0);

      setStats({
        totalRooms: rooms.length,
        availableRooms,
        pendingRequests,
        activeOffers,
        totalViews,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'listings', label: 'Room Listings', icon: Home },
    { id: 'requests', label: 'Booking Requests', icon: Users },
    { id: 'offers', label: 'Offers & Promotions', icon: Gift },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">
            House Owner Dashboard
          </h1>
          <p className="text-secondary dark:text-gray-400 mt-2">
            Manage your properties, bookings, and promotions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Total Rooms</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.totalRooms}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Home className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.availableRooms}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                  <MapPin className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Pending Requests</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.pendingRequests}
                  </p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Users className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Active Offers</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.activeOffers}
                  </p>
                </div>
                <div className="bg-accent/20 p-3 rounded-lg">
                  <Gift className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary dark:text-gray-400">Total Views</p>
                  <p className="text-2xl font-bold text-primary dark:text-gray-100">
                    {stats.totalViews}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Eye className="h-8 w-8 text-primary dark:text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-secondary/20 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${
                        activeTab === tab.id
                          ? 'border-primary dark:border-accent text-primary dark:text-accent'
                          : 'border-transparent text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-accent hover:border-secondary'
                      }
                    `}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'listings' && (
            <RoomListingsTab onUpdate={fetchDashboardStats} />
          )}
          {activeTab === 'requests' && (
            <RequestsManagementTab onUpdate={fetchDashboardStats} />
          )}
          {activeTab === 'offers' && (
            <OffersPromotionsTab onUpdate={fetchDashboardStats} />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsTab />
          )}
        </div>
      </div>
    </div>
  );
};

export default HouseOwnerDashboard;
