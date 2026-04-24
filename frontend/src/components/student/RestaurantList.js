import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Heart, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const normalizeRestaurants = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item) => item && typeof item === 'object' && item._id);
};

const extractFavoriteRestaurantIds = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => item?.restaurantId?._id)
    .filter((id) => typeof id === 'string' && id.trim().length > 0);
};

const RestaurantList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    fetchRestaurants();
    fetchFavorites();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/restaurants');
      setRestaurants(normalizeRestaurants(response.data?.restaurants));
    } catch (error) {
      toast.error('Failed to fetch restaurants');
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/student/favorites');
      setFavorites(extractFavoriteRestaurantIds(response.data?.favorites));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (restaurantId) => {
    try {
      const response = await api.post('/student/favorites', { restaurantId });
      
      if (response.data.action === 'added') {
        setFavorites([...favorites, restaurantId]);
        toast.success('Added to favorites');
      } else {
        setFavorites(favorites.filter(id => id !== restaurantId));
        toast.success('Removed from favorites');
      }
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Good Morning! Ready to explore our restaurants?';
    if (hour < 16) return 'Afternoon cravings? We\'ve got you covered!';
    if (hour < 21) return 'Dinner time! Check out what\'s available!';
    return 'Late night options available!';
  };

  const getSuggestedCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'snack';
  };

  const getCategoryDescription = () => {
    return `Explore our full menu - breakfast, lunch, dinner, snacks & drinks available!`;
  };

  const filteredRestaurants = restaurants
    .filter(restaurant => 
      (restaurant.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (restaurant.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(restaurant => 
      filterRating === 0 || restaurant.averageRating >= filterRating
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.averageRating - a.averageRating;
        case 'name':
          return a.shopName.localeCompare(b.shopName);
        default:
          return 0;
      }
    });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="rounded-2xl border border-primary/20 shadow-soft bg-primary/5 dark:bg-surface-dark p-5 space-y-4">
        {/* Row 1: search + result count */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 dark:text-gray-400 h-4 w-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by restaurant name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-9 py-3 rounded-xl border border-primary/20 dark:border-gray-600 bg-white dark:bg-gray-800 text-primary dark:text-white placeholder-primary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition text-xl leading-none"
              >
                ×
              </button>
            )}
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-primary/70 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-700 px-3 py-3 rounded-xl whitespace-nowrap shadow-sm">
            {filteredRestaurants.length} result{filteredRestaurants.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Row 2: filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-600 rounded-xl px-3 py-2.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-primary/50 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm text-primary dark:text-white bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-600 rounded-xl px-3 py-2.5 shadow-sm">
            <Star className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(parseInt(e.target.value))}
              className="text-sm text-primary dark:text-white bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="0">All Ratings</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-primary/20 dark:border-gray-600 rounded-xl px-3 py-2.5 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-primary/50 flex-shrink-0" />
            <span className="text-sm text-primary dark:text-white capitalize">
              Perfect for <span className="font-semibold">{getSuggestedCategory()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
        {filteredRestaurants.map(restaurant => (
          <div
            key={restaurant._id}
            className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1.5 bg-surface dark:bg-surface-dark border border-accent/30 dark:border-gray-700"
          >
            {/* Hero Banner */}
            <div className="relative h-36 bg-gradient-to-br from-primary via-primary-600 to-primary-700 overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10"
                style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'40px 40px'}}
              />
              {/* Large decorative initial */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[7rem] font-black text-white/5 select-none leading-none pointer-events-none">
                {(restaurant.shopName || '?')[0].toUpperCase()}
              </div>

              {/* Favorite button */}
              <button
                onClick={() => toggleFavorite(restaurant._id)}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all duration-200 border border-white/20"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    favorites.includes(restaurant._id)
                      ? 'fill-red-400 text-red-400'
                      : 'text-white/70 hover:text-red-300'
                  }`}
                />
              </button>

              {/* Avatar + name overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-4 pt-8 bg-gradient-to-t from-primary/80 to-transparent flex items-end gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0">
                  {(restaurant.shopName || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0 pb-0.5">
                  <h3 className="text-lg font-extrabold text-white leading-tight truncate drop-shadow">
                    {restaurant.shopName}
                  </h3>
                  <div className="flex items-center gap-1 text-white/75 text-xs mt-0.5">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{restaurant.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Rating row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {renderStars(restaurant.averageRating)}
                  </div>
                  <span className="text-base font-bold text-primary dark:text-gray-100">
                    {restaurant.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-secondary dark:text-gray-400 bg-background dark:bg-gray-800 px-2.5 py-1 rounded-full border border-accent/30 dark:border-gray-700">
                  {restaurant.totalRatings} {restaurant.totalRatings === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {/* Divider */}
              <div className="border-t border-accent/20 dark:border-gray-700" />

              {/* Action Button */}
              <Link to={`/student/restaurant/${restaurant._id}`}>
                <Button className="w-full group-hover:shadow-md transition-shadow" size="md">
                  View Menu
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredRestaurants.length === 0 && (
        <Card className="p-8 text-center bg-background dark:bg-surface-dark border border-accent/50 dark:border-gray-700">
          <div className="text-gray-500 dark:text-gray-400">
            {searchTerm || filterRating > 0 ? (
              <>
                <p className="text-lg mb-2">No restaurants found</p>
                <p>Try adjusting your search criteria or filters</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRating(0);
                    setSortBy('name');
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">No restaurants available yet</p>
                <p>Check back later for new restaurant listings</p>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RestaurantList;