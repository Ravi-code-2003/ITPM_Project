import React, { useState, useEffect } from 'react';
import { BookOpen, Home, Store, Calendar, Heart, ShoppingBag, DollarSign, Star, Utensils, Target, ShoppingCart } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import FavoritesPage from '../../components/student/FavoritesPage';
import OrderHistory from '../../components/student/OrderHistory';
import CartPage from '../../components/student/CartPage';
import api from '../../services/api';
import { useCart } from '../../contexts/CartContext';

const StudentDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('favorites');
  const [loading, setLoading] = useState(false);
  const { getCartCount } = useCart();

  // Check URL params for active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['favorites', 'cart', 'orders'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    { id: 'favorites', label: 'My Favorites', icon: Heart },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, count: getCartCount() },
    { id: 'orders', label: 'Order History', icon: ShoppingBag }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'favorites':
        return <FavoritesPage />;
      case 'cart':
        return <CartPage />;
      case 'orders':
        return <OrderHistory />;
      default:
        return <FavoritesPage />;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary dark:text-gray-100">Student Dashboard</h1>
              <p className="text-secondary dark:text-gray-400 mt-2">Manage your favorites, shopping cart and track your food orders</p>
            </div>
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
                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative ${
                      activeTab === tab.id
                        ? 'border-primary text-primary dark:text-primary-light'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                        {tab.count > 99 ? '99+' : tab.count}
                      </span>
                    )}
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

export default StudentDashboard;