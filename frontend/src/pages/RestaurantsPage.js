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
        <div className="mb-8 rounded-3xl border border-amber-200/80 dark:border-amber-900/50 bg-white/90 dark:bg-surface-dark/90 shadow-xl overflow-hidden">
          <div className="p-5 sm:p-7 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_42%)]">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-gray-100">Food & Dining</h1>
                <p className="text-secondary dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Discover restaurants, compare offers, and manage your student food journey in one place.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Sections</p>
                    <p className="mt-1 text-2xl font-extrabold text-primary dark:text-gray-100">{tabs.length}</p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Current View</p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                      {tabs.find((tab) => tab.id === activeTab)?.label || 'Overview'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/80 dark:bg-slate-900/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Student Focus</p>
                    <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-300">Budget</p>
                  </div>
                </div>
              </div>

              <div className="xl:w-[360px] rounded-2xl border border-amber-200 dark:border-amber-800 bg-white/90 dark:bg-slate-900/40 p-4 sm:p-5 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.12em] text-secondary dark:text-gray-400">Tip</p>
                <h3 className="mt-2 font-semibold text-primary dark:text-gray-100 leading-snug">Check offers before ordering</h3>
                <p className="text-xs text-secondary dark:text-gray-300 mt-2">
                  Switch between Offers, Combos, and Favorites to get better value and faster ordering decisions.
                </p>
              </div>
            </div>
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
