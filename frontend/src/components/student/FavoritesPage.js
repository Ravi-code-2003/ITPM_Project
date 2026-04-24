import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

const normalizeFavorites = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter(
    (item) => item && typeof item === 'object' && item._id && item.restaurantId && item.restaurantId._id
  );
};

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
      setFavorites(normalizeFavorites(response.data?.favorites));
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
      setFavorites((prev) => normalizeFavorites(prev).filter((fav) => fav.restaurantId._id !== restaurantId));
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
        <h1 className="text-2xl font-bold text-primary dark:text-gray-100 mb-1">My Favourite Restaurants</h1>
        <p className="text-secondary dark:text-gray-400 text-sm">
          Your go-to places for delicious meals &bull; {favorites.length} restaurant{favorites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {favorites.map(favorite => {
            const restaurant = favorite.restaurantId;
            return (
              <div
                key={favorite._id}
                className="group relative rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-1.5 bg-surface dark:bg-surface-dark border border-accent/30 dark:border-gray-700"
              >
                {/* Hero Banner */}
                <div className="relative h-36 bg-gradient-to-br from-primary via-primary-600 to-primary-700 overflow-hidden">
                  {/* Background dot pattern */}
                  <div className="absolute inset-0 opacity-10"
                    style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize:'40px 40px'}}
                  />
                  {/* Decorative ghost initial */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[7rem] font-black text-white/5 select-none leading-none pointer-events-none">
                    {(restaurant.shopName || '?')[0].toUpperCase()}
                  </div>

                  {/* Remove favourite button */}
                  <button
                    onClick={() => removeFavorite(restaurant._id)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/15 hover:bg-rose-500/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200 border border-white/20 group/heart"
                    title="Remove from favourites"
                  >
                    <Heart className="h-5 w-5 fill-red-400 text-red-400 group-hover/heart:fill-white group-hover/heart:text-white transition-colors" />
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
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-accent/30 dark:border-gray-700 bg-surface dark:bg-surface-dark p-12 text-center shadow-soft">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-rose-400" />
          </div>
          <p className="text-lg font-semibold text-primary dark:text-white mb-1">No favourites yet</p>
          <p className="text-sm text-secondary dark:text-gray-400 mb-6">
            Start exploring restaurants and tap the heart icon to save your favourites.
          </p>
          <Button>Discover Restaurants</Button>
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;