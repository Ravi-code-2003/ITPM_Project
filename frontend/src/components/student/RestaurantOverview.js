import React, { useEffect, useState } from 'react';
import {
  UtensilsCrossed,
  Tag,
  ShoppingBag,
  Heart,
  Star,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

const normalizeRestaurants = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object' && item._id);
};

const normalizeOrders = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object' && item._id);
};

const normalizeFavorites = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) => item && typeof item === 'object' && item._id && item.restaurantId
  );
};

const RestaurantOverview = ({ onOpenTab }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    restaurants: 0,
    offers: 0,
    orders: 0,
    favorites: 0
  });
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);

      const [restaurantsResult, offersResult, ordersResult, favoritesResult] = await Promise.allSettled([
        api.get('/student/restaurants'),
        api.get('/student/offers'),
        api.get('/student/orders?limit=5'),
        api.get('/student/favorites')
      ]);

      const restaurants =
        restaurantsResult.status === 'fulfilled'
          ? normalizeRestaurants(restaurantsResult.value?.data?.restaurants)
          : [];
      const offers =
        offersResult.status === 'fulfilled' && Array.isArray(offersResult.value?.data?.offers)
          ? offersResult.value.data.offers.filter((item) => item && typeof item === 'object')
          : [];
      const orders =
        ordersResult.status === 'fulfilled'
          ? normalizeOrders(ordersResult.value?.data?.orders)
          : [];
      const favorites =
        favoritesResult.status === 'fulfilled'
          ? normalizeFavorites(favoritesResult.value?.data?.favorites)
          : [];

      const allFailed =
        restaurantsResult.status === 'rejected' &&
        offersResult.status === 'rejected' &&
        ordersResult.status === 'rejected' &&
        favoritesResult.status === 'rejected';

      if (allFailed) {
        toast.error('Failed to load restaurant overview');
      }

      setStats({
        restaurants: restaurants.length,
        offers: offers.length,
        orders: orders.length,
        favorites: favorites.length
      });

      const highestRated = [...restaurants]
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 3);

      setTopRestaurants(highestRated);
      setRecentOrders(orders.slice(0, 3));
      setFavoriteRestaurants(favorites.slice(0, 3));
    } catch (error) {
      console.error('Error loading restaurant overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      id: 'restaurants',
      label: 'Available Restaurants',
      value: stats.restaurants,
      icon: UtensilsCrossed,
      actionTab: 'restaurants',
      color: 'bg-primary',
      lightBg: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-primary/20',
    },
    {
      id: 'offers',
      label: 'Active Food Offers',
      value: stats.offers,
      icon: Tag,
      actionTab: 'offers',
      color: 'bg-orange-500',
      lightBg: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    {
      id: 'orders',
      label: 'Recent Orders',
      value: stats.orders,
      icon: ShoppingBag,
      actionTab: 'orders',
      color: 'bg-emerald-500',
      lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'favorites',
      label: 'Favorite Restaurants',
      value: stats.favorites,
      icon: Heart,
      actionTab: 'favorites',
      color: 'bg-rose-500',
      lightBg: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-800',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Restaurant Overview</h2>
          <p className="text-secondary dark:text-gray-400 mt-1 text-sm">
            Quick summary of food options, order activity, and your favorite places
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`relative rounded-2xl border ${card.borderColor} bg-surface dark:bg-surface-dark shadow-soft overflow-hidden group hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200`}
            >
              {/* Accent top bar */}
              <div className={`h-1.5 ${card.color}`} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.lightBg} p-2.5 rounded-xl`}>
                    <Icon className={`h-5 w-5 ${card.textColor}`} />
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenTab && onOpenTab(card.actionTab)}
                    className={`text-xs font-semibold ${card.textColor} hover:underline`}
                  >
                    Open →
                  </button>
                </div>
                <p className="text-3xl font-extrabold text-primary dark:text-white">{card.value}</p>
                <p className="text-sm text-secondary dark:text-gray-400 mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom three panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Food Highlights */}
        <div className="rounded-2xl border border-primary/20 bg-surface dark:bg-surface-dark shadow-soft overflow-hidden">
          <div className="bg-primary px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">🏆 Top Restaurants</h3>
            <Star className="h-4 w-4 text-yellow-300" />
          </div>
          <div className="p-5">
            {topRestaurants.length > 0 ? (
              <div className="space-y-3">
                {topRestaurants.map((restaurant, index) => (
                  <div key={restaurant._id || `restaurant-${index}`} className="flex items-center gap-3 bg-primary/5 dark:bg-gray-800 rounded-xl p-3 border border-primary/10 dark:border-gray-700">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-black text-base flex-shrink-0">
                      {(restaurant.shopName || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary dark:text-white text-sm truncate">{restaurant.shopName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-secondary dark:text-gray-400 mt-0.5">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="font-medium">{(restaurant.averageRating || 0).toFixed(1)}</span>
                        <span>·</span>
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{restaurant.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary dark:text-gray-400 py-4 text-center">No restaurant data yet.</p>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => onOpenTab && onOpenTab('restaurants')}>
              Browse All Restaurants
            </Button>
          </div>
        </div>

        {/* Order History */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-surface dark:bg-surface-dark shadow-soft overflow-hidden">
          <div className="bg-emerald-600 px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">🛍️ Order History</h3>
            <Clock className="h-4 w-4 text-emerald-200" />
          </div>
          <div className="p-5">
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order, index) => (
                  <div key={order._id || `order-${index}`} className="flex items-center justify-between gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900">
                    <div>
                      <p className="font-semibold text-primary dark:text-white text-sm">
                        {order.restaurantId?.shopName || 'Restaurant'}
                      </p>
                      <p className="text-xs text-secondary dark:text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      LKR {(order.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary dark:text-gray-400 py-4 text-center">No orders yet.</p>
            )}
            <Button variant="outline" className="w-full mt-4 flex items-center justify-center gap-2" onClick={() => onOpenTab && onOpenTab('orders')}>
              View Full History
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Favorites */}
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-surface dark:bg-surface-dark shadow-soft overflow-hidden">
          <div className="bg-rose-500 px-5 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">❤️ Favourites</h3>
            <Heart className="h-4 w-4 text-rose-200 fill-rose-200" />
          </div>
          <div className="p-5">
            {favoriteRestaurants.length > 0 ? (
              <div className="space-y-3">
                {favoriteRestaurants.map((favorite, index) => (
                  <div key={favorite._id || `favorite-${index}`} className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 border border-rose-100 dark:border-rose-900">
                    <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                      {(favorite.restaurantId?.shopName || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary dark:text-white text-sm truncate">
                        {favorite.restaurantId?.shopName || 'Restaurant'}
                      </p>
                      <p className="text-xs text-secondary dark:text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{favorite.restaurantId?.location || 'Location not available'}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary dark:text-gray-400 py-4 text-center">No favourites saved yet.</p>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => onOpenTab && onOpenTab('favorites')}>
              Open Favourites
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOverview;