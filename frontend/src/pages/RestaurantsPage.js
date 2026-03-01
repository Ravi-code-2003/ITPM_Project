import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Utensils, Heart, ShoppingBag, Star, Tag } from 'lucide-react';
import RestaurantList from '../components/student/RestaurantList';
import BudgetTracker from '../components/student/BudgetTracker';
import AllOffersPage from './AllOffersPage';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Link } from 'react-router-dom';
import api from '../services/api';

const RestaurantsPage = () => {
  const [activeTab, setActiveTab] = useState('restaurants');
  const [stats, setStats] = useState({
    totalOrders: 0,
    monthlySpent: 0,
    favoriteRestaurants: 0,
    currentOffers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [ordersRes, favoritesRes, offersRes, budgetRes] = await Promise.all([
        api.get('/student/orders?limit=3'),
        api.get('/student/favorites'),
        api.get('/student/offers'),
        api.get('/student/budget-tracker?monthlyBudget=500') // Default budget for calculation
      ]);

      setStats({
        totalOrders: ordersRes.data.pagination.totalOrders,
        monthlySpent: budgetRes.data.budgetTracker.totalSpent,
        favoriteRestaurants: favoritesRes.data.favorites.length,
        currentOffers: offersRes.data.offers.length
      });

      setRecentOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats if API calls fail
      setStats({
        totalOrders: 0,
        monthlySpent: 0,
        favoriteRestaurants: 0,
        currentOffers: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    const name = 'Student'; // You can get this from auth context
    
    if (hour < 11) return `Good Morning, ${name}! 🌅`;
    if (hour < 16) return `Good Afternoon, ${name}! ☀️`;
    if (hour < 21) return `Good Evening, ${name}! 🌆`;
    return `Good Night, ${name}! 🌙`;
  };

  const getSuggestedCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'snack';
  };

  const getCurrentMealMessage = () => {
    const category = getSuggestedCategory();
    const messages = {
      breakfast: 'Start your day right',
      lunch: 'Fuel your afternoon', 
      dinner: 'Perfect dinner time',
      snack: 'Late night cravings'
    };
    return messages[category];
  };

  const tabs = [
    { id: 'restaurants', label: 'Find Restaurants', icon: Utensils },
    { id: 'offers', label: 'Special Offers', icon: Tag },
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'budget', label: 'Budget Tracker', icon: DollarSign }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'restaurants':
        return <RestaurantList />;
      case 'offers':
        return <AllOffersPage />;
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Greeting */}
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">{getTimeBasedGreeting()}</h2>
                <p className="opacity-90">
                  {getCurrentMealMessage()}! Explore delicious options from our campus restaurants - all serving breakfast, lunch, dinner, snacks & drinks.
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Total Orders</p>
                      <p className="text-2xl font-bold text-primary dark:text-gray-100">
                        {stats.totalOrders}
                      </p>
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <ShoppingBag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Monthly Spent</p>
                      <p className="text-2xl font-bold text-primary dark:text-gray-100">
                        ${stats.monthlySpent.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Favorite Places</p>
                      <p className="text-2xl font-bold text-primary dark:text-gray-100">
                        {stats.favoriteRestaurants}
                      </p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                      <Heart className="h-8 w-8 text-red-600 dark:text-red-400" />
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
                        {stats.currentOffers}
                      </p>
                    </div>
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                      <Star className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('restaurants')}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Utensils className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Find Food</h3>
                  </div>
                  <p className="text-secondary dark:text-gray-400 mb-4">
                    Explore restaurants, view menus, and place orders
                  </p>
                  <Button className="w-full">
                    Browse Restaurants
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('offers')}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                      <Star className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Special Offers</h3>
                  </div>
                  <p className="text-secondary dark:text-gray-400 mb-4">
                    Discover amazing deals and discounts from all restaurants
                  </p>
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    View Offers
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-soft-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('budget')}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                      <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary dark:text-gray-100 ml-3">Budget Tracker</h3>
                  </div>
                  <p className="text-secondary dark:text-gray-400 mb-4">
                    Track your monthly food spending and stay on budget
                  </p>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Manage Budget
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Your latest food orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.map(order => (
                      <div key={order._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium text-primary dark:text-gray-100">
                            {order.restaurantId.shopName}
                          </p>
                          <p className="text-sm text-secondary dark:text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()} • {order.status}
                          </p>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
      case 'budget':
        return <BudgetTracker />;
      default:
        return <RestaurantList />;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Food & Dining</h1>
          <p className="text-secondary dark:text-gray-400 mt-2">Discover restaurants, manage your budget, and track your food journey</p>
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
        {loading && activeTab === 'overview' ? (
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

export default RestaurantsPage;
