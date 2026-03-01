import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Eye, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/favorites');
      setFavorites(response.data.favorites);
    } catch (error) {
      toast.error('Failed to fetch favorites');
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (restaurantId) => {
    try {
      await api.post('/student/favorites', { restaurantId });
      setFavorites(favorites.filter(fav => fav.restaurantId._id !== restaurantId));
      toast.success('Removed from favorites');
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold text-primary dark:text-gray-100 mb-2">My Favorite Restaurants</h1>
        <p className="text-secondary dark:text-gray-400">
          Your go-to places for delicious meals • {favorites.length} restaurant{favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(favorite => {
            const restaurant = favorite.restaurantId;
            return (
              <Card key={favorite._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                      onClick={() => removeFavorite(restaurant._id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
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

                  {/* Added Date */}
                  <div className="mb-4">
                    <p className="text-sm text-secondary dark:text-gray-400">
                      Added on {new Date(favorite.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Action Button */}
                  <Link to={`/student/restaurant/${restaurant._id}`}>
                    <Button className="w-full flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      View Menu
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">No favorite restaurants yet</p>
            <p className="mb-6">
              Start exploring restaurants and add them to your favorites for quick access
            </p>
            <Link to="/student/restaurants">
              <Button>
                Discover Restaurants
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FavoritesPage;