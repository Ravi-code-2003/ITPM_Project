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
      actionTab: 'restaurants'
    },
    {
      id: 'offers',
      label: 'Active Food Offers',
      value: stats.offers,
      icon: Tag,
      actionTab: 'offers'
    },
    {
      id: 'orders',
      label: 'Recent Orders',
      value: stats.orders,
      icon: ShoppingBag,
      actionTab: 'orders'
    },
    {
      id: 'favorites',
      label: 'Favorite Restaurants',
      value: stats.favorites,
      icon: Heart,
      actionTab: 'favorites'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Restaurant Overview</h2>
        <p className="text-secondary dark:text-gray-400 mt-1">
          Quick summary of food options, order activity, and your favorite places
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.id} className="p-5 border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-lg">
                  <Icon className="h-5 w-5 text-primary dark:text-primary-light" />
                </div>
                <button
                  type="button"
                  onClick={() => onOpenTab && onOpenTab(card.actionTab)}
                  className="text-xs font-semibold text-primary dark:text-primary-light hover:underline"
                >
                  Open
                </button>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-secondary dark:text-gray-400 mt-1">{card.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100">Food Highlights</h3>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>

          {topRestaurants.length > 0 ? (
            <div className="space-y-3">
              {topRestaurants.map((restaurant, index) => (
                <div key={restaurant._id || `restaurant-${index}`} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-gray-900 dark:text-white">{restaurant.shopName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{(restaurant.averageRating || 0).toFixed(1)}</span>
                    <span className="text-gray-400">•</span>
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{restaurant.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary dark:text-gray-400">No restaurant data yet.</p>
          )}

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onOpenTab && onOpenTab('restaurants')}
          >
            Browse Food Options
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100">Order History</h3>
            <Clock className="h-4 w-4 text-primary" />
          </div>

          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div key={order._id || `order-${index}`} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.restaurantId?.shopName || 'Restaurant'}
                      </p>
                      <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      LKR {(order.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary dark:text-gray-400">No orders yet.</p>
          )}

          <Button
            variant="outline"
            className="w-full mt-4 flex items-center justify-center gap-2"
            onClick={() => onOpenTab && onOpenTab('orders')}
          >
            View Full History
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary dark:text-gray-100">Favorite Restaurants</h3>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>

          {favoriteRestaurants.length > 0 ? (
            <div className="space-y-3">
              {favoriteRestaurants.map((favorite, index) => (
                <div key={favorite._id || `favorite-${index}`} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {favorite.restaurantId?.shopName || 'Restaurant'}
                  </p>
                  <p className="text-xs text-secondary dark:text-gray-400 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {favorite.restaurantId?.location || 'Location not available'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary dark:text-gray-400">No favorites saved yet.</p>
          )}

          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => onOpenTab && onOpenTab('favorites')}
          >
            Open Favorites
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantOverview;