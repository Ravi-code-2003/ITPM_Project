import React, { useState, useEffect } from 'react';
import { Store, Users, BarChart, Package, Plus, Calendar, TrendingUp, Eye, Vote } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import FoodMenuCRUD from '../../components/restaurant/FoodMenuCRUD';
import OffersCRUD from '../../components/restaurant/OffersCRUD';
import ComboMealCRUD from '../../components/restaurant/ComboMealCRUD';
import AnalyticsDashboard from '../../components/restaurant/AnalyticsDashboard';
import PollManagement from '../../components/restaurant/PollManagement';
import api from '../../services/api';

const ShopOwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalFoods: 0,
    activeOffers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics, foods, and offers in parallel
      const [analyticsRes, foodsRes, offersRes] = await Promise.all([
        api.get('/shop/analytics?period=30'),
        api.get('/shop/foods'),
        api.get('/shop/offers')
      ]);

      setStats({
        totalOrders: analyticsRes.data.analytics.totalOrders,
        totalRevenue: analyticsRes.data.analytics.totalRevenue,
        totalFoods: foodsRes.data.foods.length,
        activeOffers: offersRes.data.offers.filter(offer => offer.isActive && new Date(offer.validDate) >= new Date()).length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats if API calls fail
      setStats({
        totalOrders: 0,
        totalRevenue: 0,
        totalFoods: 0,
        activeOffers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'menu', label: 'Menu Management', icon: Package },
    { id: 'offers', label: 'Offers & Promotions', icon: Store },
    { id: 'polls', label: 'Customer Polls', icon: Vote },
    { id: 'combos', label: 'Combo Meals', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Total Orders (30d)</p>
                      <p className="text-2xl font-bold text-primary dark:text-gray-100">
                        {stats.totalOrders}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Revenue (30d)</p>
                      <p className="text-2xl font-bold text-primary dark:text-gray-100">
                        ${stats.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                      <BarChart className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Menu Items</p>
                      <p className="text-2xl font-bold text-primary dark:text-gray-100">
                        {stats.totalFoods}
                      </p>
                    </div>
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                      <Package className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                      <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your restaurant efficiently</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Button 
                    onClick={() => setActiveTab('menu')}
                    className="h-20 flex flex-col gap-2"
                  >
                    <Package className="h-6 w-6" />
                    Add Food Items
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('offers')}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                  >
                    <Store className="h-6 w-6" />
                    Create Offers
                  </Button>

                  <Button 
                    onClick={() => setActiveTab('polls')}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                  >
                    <Vote className="h-6 w-6" />
                    Create Polls
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('combos')}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                  >
                    <Plus className="h-6 w-6" />
                    Combo Meals
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('analytics')}
                    variant="outline"
                    className="h-20 flex flex-col gap-2"
                  >
                    <TrendingUp className="h-6 w-6" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tips for New Users */}
            {stats.totalFoods === 0 && (
              <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-blue-500 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Build Your Complete Menu</h3>
                    <p className="text-secondary dark:text-gray-400 mb-4">
                      Add items across all categories - breakfast, lunch, dinner, snacks & drinks to attract students throughout the day.
                    </p>
                    <Button onClick={() => setActiveTab('menu')}>
                      Add Your First Food Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'menu':
        return <FoodMenuCRUD />;
      case 'offers':
        return <OffersCRUD />;
      case 'polls':
        return <PollManagement />;
      case 'combos':
        return <ComboMealCRUD />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Shop Owner Dashboard</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">Manage your full-service restaurant and connect with students all day long</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary dark:text-primary-light'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;