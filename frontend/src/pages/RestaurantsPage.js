import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Utensils, Tag, ShoppingBag, Heart, Box } from 'lucide-react';
import RestaurantList from '../components/student/RestaurantList';
import RestaurantOverview from '../components/student/RestaurantOverview';
import OrderHistory from '../components/student/OrderHistory';
import FavoritesPage from '../components/student/FavoritesPage';
import AllOffersPage from './AllOffersPage';
import AllCombosPage from './AllCombosPage';

const RestaurantsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams] = useSearchParams();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'restaurants', label: 'Find Restaurants', icon: Utensils },
    { id: 'offers', label: 'Special Offers', icon: Tag },
    { id: 'combos', label: 'Combo Meals', icon: Box },
    { id: 'orders', label: 'Order History', icon: ShoppingBag },
    { id: 'favorites', label: 'Favorites', icon: Heart }
  ];

  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery && tabs.some((tab) => tab.id === tabFromQuery)) {
      setActiveTab(tabFromQuery);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <RestaurantOverview onOpenTab={setActiveTab} />;
      case 'restaurants':
        return <RestaurantList />;
      case 'offers':
        return <AllOffersPage />;
      case 'combos':
        return <AllCombosPage />;
      case 'orders':
        return <OrderHistory />;
      case 'favorites':
        return <FavoritesPage />;
      default:
        return <RestaurantOverview onOpenTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white dark:bg-background-dark py-8">
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
        {renderTabContent()}
      </div>
    </div>
  );
};

export default RestaurantsPage;
