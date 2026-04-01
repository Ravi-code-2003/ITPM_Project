import React, { useState, useEffect } from 'react';
import { Store, BarChart, Package, Plus, TrendingUp, Vote, ShoppingBag } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import FoodMenuCRUD from '../../components/restaurant/FoodMenuCRUD';
import OffersCRUD from '../../components/restaurant/OffersCRUD';
import ComboMealCRUD from '../../components/restaurant/ComboMealCRUD';
import AnalyticsDashboard from '../../components/restaurant/AnalyticsDashboard';
import PollManagement from '../../components/restaurant/PollManagement';
import OrdersManagement from '../../components/restaurant/OrdersManagement';
import api from '../../services/api';

const ShopOwnerDashboard = () => {
  const [searchParams] = useSearchParams();
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

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'orders', 'menu', 'offers', 'polls', 'combos', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
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
          <div className="space-y-8">

            {/* Welcome banner */}
            <div className="rounded-2xl bg-gradient-to-r from-primary/90 to-primary p-8 text-white shadow-md">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Welcome back! 👋</h2>
                  <p className="text-white/80 text-sm">
                    Here's a snapshot of your restaurant's performance over the last 30 days.
                  </p>
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('orders')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl">
                      <ShoppingBag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">30 days</span>
                  </div>
                  <p className="text-3xl font-bold text-primary dark:text-gray-100">{stats.totalOrders}</p>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">Total Orders</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('analytics')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl">
                      <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">30 days</span>
                  </div>
                  <p className="text-3xl font-bold text-primary dark:text-gray-100">LKR {stats.totalRevenue.toFixed(0)}</p>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">Total Revenue</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('menu')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl">
                      <Package className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">active</span>
                  </div>
                  <p className="text-3xl font-bold text-primary dark:text-gray-100">{stats.totalFoods}</p>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">Menu Items</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('offers')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                      <Store className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">live</span>
                  </div>
                  <p className="text-3xl font-bold text-primary dark:text-gray-100">{stats.activeOffers}</p>
                  <p className="text-sm text-secondary dark:text-gray-400 mt-1">Active Offers</p>
                </CardContent>
              </Card>
            </div>

            {/* Management tiles */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">Manage Your Restaurant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

                <div
                  onClick={() => setActiveTab('menu')}
                  className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-purple-400 hover:shadow-lg transition-all"
                >
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl w-fit mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                    <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-1">Menu Management</h4>
                  <p className="text-sm text-secondary dark:text-gray-400">Add, edit or remove food items. Keep your menu fresh and up to date.</p>
                </div>

                <div
                  onClick={() => setActiveTab('offers')}
                  className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-orange-400 hover:shadow-lg transition-all"
                >
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl w-fit mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                    <Store className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-1">Offers & Promotions</h4>
                  <p className="text-sm text-secondary dark:text-gray-400">Create discount offers to attract more students and boost your sales.</p>
                </div>

                <div
                  onClick={() => setActiveTab('combos')}
                  className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-pink-400 hover:shadow-lg transition-all"
                >
                  <div className="bg-pink-100 dark:bg-pink-900/30 p-3 rounded-xl w-fit mb-4 group-hover:bg-pink-200 dark:group-hover:bg-pink-900/50 transition-colors">
                    <Plus className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-1">Combo Meals</h4>
                  <p className="text-sm text-secondary dark:text-gray-400">Bundle popular items into combo deals for a better value experience.</p>
                </div>

                <div
                  onClick={() => setActiveTab('polls')}
                  className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-blue-400 hover:shadow-lg transition-all"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl w-fit mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Vote className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-1">Customer Polls</h4>
                  <p className="text-sm text-secondary dark:text-gray-400">Ask students what they want next. Use polls to drive menu decisions.</p>
                </div>

                <div
                  onClick={() => setActiveTab('orders')}
                  className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-green-400 hover:shadow-lg transition-all"
                >
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl w-fit mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                    <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-1">Orders</h4>
                  <p className="text-sm text-secondary dark:text-gray-400">Track and update the status of orders placed by students in real time.</p>
                </div>

                <div
                  onClick={() => setActiveTab('analytics')}
                  className="group cursor-pointer rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-teal-400 hover:shadow-lg transition-all"
                >
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-xl w-fit mb-4 group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
                    <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h4 className="font-semibold text-primary dark:text-gray-100 mb-1">Analytics</h4>
                  <p className="text-sm text-secondary dark:text-gray-400">Dive into sales trends, popular items and daily revenue breakdowns.</p>
                </div>

              </div>
            </div>

            {/* Empty-state nudge */}
            {stats.totalFoods === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/10 p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-60" />
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">Your menu is empty</h3>
                <p className="text-secondary dark:text-gray-400 mb-4 max-w-md mx-auto">
                  Start by adding food items to your menu so students can discover and order from you.
                </p>
                <Button onClick={() => setActiveTab('menu')}>
                  Add Your First Food Item
                </Button>
              </div>
            )}

          </div>
        );
      case 'orders':
        return <OrdersManagement />;
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