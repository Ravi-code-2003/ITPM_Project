import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Heart, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

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
      setRestaurants(response.data.restaurants);
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
      setFavorites(response.data.favorites.map(fav => fav.restaurantId._id));
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

  const filteredRestaurants = restaurants
    .filter(restaurant => 
      restaurant.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.location.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary dark:text-gray-100 mb-2">
          {getTimeBasedGreeting()}
        </h1>
        <p className="text-secondary dark:text-gray-400">
          Discover delicious food from local campus restaurants
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search restaurants or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value="0">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                Perfect for {getSuggestedCategory()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRestaurants.map(restaurant => (
          <Card key={restaurant._id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-1">
                    {restaurant.shopName}
                  </h3>
                  <div className="flex items-center gap-1 text-secondary dark:text-gray-400 text-sm">
                    <MapPin className="h-3 w-3" />
                    {restaurant.location}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleFavorite(restaurant._id)}
                  className="p-2"
                >
                  <Heart 
                    className={`h-5 w-5 ${
                      favorites.includes(restaurant._id)
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400'
                    }`}
                  />
                </Button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {renderStars(restaurant.averageRating)}
                </div>
                <span className="text-sm text-secondary dark:text-gray-400">
                  {restaurant.averageRating.toFixed(1)} ({restaurant.totalRatings} reviews)
                </span>
              </div>

              {/* Owner Info */}
              <div className="mb-4">
                <p className="text-sm text-secondary dark:text-gray-400">
                  Owned by {restaurant.shopOwnerId?.fullName || 'Shop Owner'}
                </p>
              </div>

              {/* Action Button */}
              <Link to={`/student/restaurant/${restaurant._id}`}>
                <Button className="w-full">
                  View Menu
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredRestaurants.length === 0 && (
        <Card className="p-8 text-center">
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
