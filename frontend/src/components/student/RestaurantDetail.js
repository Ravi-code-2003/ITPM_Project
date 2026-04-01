import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Star, Heart, MapPin, ShoppingCart, Tag, Vote } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import { downloadOrderPDF } from '../../utils/pdfGenerator';
import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [orderingItem, setOrderingItem] = useState(null);
  const [polls, setPolls] = useState([]);
  const [enhancedPolls, setEnhancedPolls] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [restaurantRating, setRestaurantRating] = useState({ average: 0, count: 0 });

  const fetchRestaurantMenu = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch restaurant menu and rating in parallel
      const [menuResponse, ratingResponse] = await Promise.all([
        api.get(`/student/restaurant/${id}/menu`),
        api.get(`/student/restaurants`).then(res => {
          const currentRestaurant = res.data.restaurants.find(r => r._id === id);
          return currentRestaurant ? {
            average: currentRestaurant.averageRating || 0,
            count: currentRestaurant.totalRatings || 0
          } : { average: 0, count: 0 };
        })
      ]);
      
      setRestaurant(menuResponse.data.restaurant);
      setMenu(menuResponse.data.menu);
      setActiveCategory('all'); // Always start with full menu view
      setRestaurantRating(ratingResponse);
    } catch (error) {
      toast.error('Failed to fetch restaurant menu');
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const submitRating = async () => {
    try {
      if (userRating === 0) {
        toast.error('Please select a rating');
        return;
      }

      await api.post('/student/rating', {
        restaurantId: id,
        rating: userRating,
        comment: ratingComment
      });

      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setUserRating(0);
      setRatingComment('');
      
      // Refresh restaurant data to get updated rating
      fetchRestaurantMenu();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer transition-colors ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={readOnly ? undefined : () => onRatingChange?.(star)}
          />
        ))}
        {readOnly && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            ({rating.toFixed(1)})
          </span>
        )}
      </div>
    );
  };

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const response = await api.get('/student/favorites');
      const favoriteIds = response.data.favorites.map(fav => fav.restaurantId._id);
      setIsFavorite(favoriteIds.includes(id));
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  }, [id]);

  const fetchPolls = useCallback(async () => {
    try {
      const response = await api.get(`/student/poll/${id}`);
      setPolls(response.data.polls);
    } catch (error) {
      console.error('Error fetching polls:', error);
    }
  }, [id]);

  const fetchEnhancedPolls = useCallback(async () => {
    try {
      const response = await api.get(`/student/polls/${id}`);
      setEnhancedPolls(response.data.polls || []);
    } catch (error) {
      console.error('Error fetching enhanced polls:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchRestaurantMenu();
      checkFavoriteStatus();
      fetchPolls();
      fetchEnhancedPolls();
    }
  }, [id, fetchRestaurantMenu, checkFavoriteStatus, fetchPolls, fetchEnhancedPolls]);

  const toggleFavorite = async () => {
    try {
      const response = await api.post('/student/favorites', { restaurantId: id });
      setIsFavorite(response.data.action === 'added');
      toast.success(response.data.message);
    } catch (error) {
      toast.error('Failed to update favorites');
    }
  };

  // Handle immediate order with auto-download receipt
  const handleOrderNow = async (item, isCombo = false) => {
    setOrderingItem(item);
    try {
      // Create order data for single item
      const orderItems = [{
        [isCombo ? 'comboMealId' : 'foodItemId']: item._id,
        quantity: 1,
        price: isCombo ? item.totalPrice : item.price
      }];

      const orderData = {
        restaurantId: id,
        items: orderItems,
        totalAmount: isCombo ? item.totalPrice : item.price
      };

      const response = await api.post('/student/orders', orderData);
      
      if (response.data.success) {
        toast.success('Order placed successfully!');
        
        // Prepare data for receipt download
        const receiptData = {
          _id: response.data.order._id,
          orderNumber: response.data.order._id?.slice(-8).toUpperCase() || 'N/A',
          items: [{
            id: item._id,
            name: item.name,
            price: isCombo ? item.totalPrice : item.price,
            quantity: 1,
            isCombo: isCombo
          }],
          totalAmount: isCombo ? item.totalPrice : item.price,
          restaurant: {
            name: restaurant?.shopName || 'Restaurant',
            location: restaurant?.location || 'Location not specified'
          },
          orderDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        // Auto-download receipt
        downloadOrderPDF(receiptData);
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrderingItem(null);
    }
  };

  // Handle add to cart
  const handleAddToCart = (item, isCombo = false) => {
    try {
      console.log('Adding to cart:', item, isCombo, id, restaurant?.shopName);
      addToCart(item, isCombo, id, restaurant?.shopName);
      toast.success(`${item.name} added to cart!`);
      console.log('Item added successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const voteInPoll = async (foodItemId) => {
    try {
      await api.post('/student/poll/vote', {
        restaurantId: id,
        foodItemId
      });
      toast.success('Vote recorded successfully!');
      fetchPolls(); // Refresh polls
      setShowPollModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to vote');
    }
  };

  const voteInPollProposal = async (pollId, proposalId) => {
    try {
      await api.post('/student/polls/vote-proposal', {
        pollId,
        proposalId
      });
      toast.success('Vote recorded successfully!');
      await fetchEnhancedPolls(); // Refresh enhanced polls
      setShowPollModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to vote');
    }
  };

  const getCategoryItems = (category) => {
    if (category === 'all') {
      // Return all food items from all categories
      const allItems = [];
      categories.slice(1).forEach(cat => { // Skip 'all' category
        const items = menu?.categorizedMenu[cat] || [];
        allItems.push(...items);
      });
      return allItems;
    }
    return menu?.categorizedMenu[category] || [];
  };

  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'drink'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant || !menu) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Restaurant not found</p>
        <Button onClick={() => navigate('/restaurants')} className="mt-4">
          Back to Restaurants
        </Button>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/restaurants')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Restaurants</span>
          </Button>
        </div>

        {/* Action Buttons - Floating */}
        <div className="fixed top-20 right-6 z-40 flex flex-col gap-3">
          {(polls.length > 0 || enhancedPolls.length > 0) && (
            <Button
              onClick={() => setShowPollModal(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white shadow-lg rounded-full w-12 h-12 p-0"
              title="Vote for Tomorrow's Special"
            >
              <Vote className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Restaurant Hero Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8 border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              {/* Restaurant Info - Left Side */}
              <div className="flex items-center gap-4 flex-1">
                {/* Restaurant Avatar */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 shadow-sm">
                  <div className="text-2xl">🍽️</div>
                </div>
                
                {/* Restaurant Details */}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {restaurant.shopName}
                  </h1>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm font-medium">{restaurant.location}</span>
                  </div>

                  {/* Rating - Inline */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <StarRating rating={restaurantRating.average} readOnly />
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {restaurantRating.average > 0 ? restaurantRating.average.toFixed(1) : 'New'}
                      </span>
                      {restaurantRating.count > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({restaurantRating.count} review{restaurantRating.count !== 1 ? 's' : ''})
                        </span>
                      )}
                      {restaurantRating.count === 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          No reviews yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Right Side */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowRatingModal(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Rate Now
                </Button>
                
                <Button
                  onClick={toggleFavorite}
                  variant="ghost"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all text-sm font-semibold ring-1 ${
                    isFavorite 
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-400 ring-rose-200 shadow-none hover:shadow-none dark:bg-rose-900/35 dark:hover:bg-rose-900/45 dark:text-rose-200 dark:border-rose-600 dark:ring-rose-800/60' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 ring-gray-200 shadow-none hover:shadow-none dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 dark:border-gray-500 dark:ring-gray-700/70'
                  }`}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span className="font-medium">
                    {isFavorite ? 'Favorited' : 'Favorite'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Special Offers Section */}
        {(menu?.offers || []).length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 mb-8 border border-green-200 dark:border-green-800">
            <h2 className="text-2xl font-bold mb-6 text-green-800 dark:text-green-200 flex items-center gap-3">
              <div className="bg-green-500 rounded-lg p-2">
                <Tag className="h-6 w-6 text-white" />
              </div>
              Special Offers
              <span className="text-lg text-green-600 dark:text-green-400 font-normal">
                ({(menu?.offers || []).length} amazing deals)
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {(menu?.offers || []).map(offer => (
                <div key={offer._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow border border-green-200 dark:border-green-700">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                        📍 {offer.restaurantId?.shopName || 'Restaurant'}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                        {offer.foodItemId?.name || 'Food Item'}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {offer.discountPercent}% OFF
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        LKR {offer.foodItemId?.price?.toFixed(2) || '0.00'}
                      </span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        LKR {((offer.foodItemId?.price || 0) * (1 - offer.discountPercent / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-3 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                    Valid until {new Date(offer.validDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Polls Section */}
        {(enhancedPolls.length > 0 || polls.length > 0) && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-8 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-200 flex items-center gap-3">
                <div className="bg-purple-500 rounded-lg p-2">
                  <Vote className="h-6 w-6 text-white" />
                </div>
                Vote for Tomorrow's Specials
                <span className="text-lg text-purple-600 dark:text-purple-400 font-normal">
                  ({enhancedPolls.length > 0 ? enhancedPolls.length : polls.length} active poll{(enhancedPolls.length > 0 ? enhancedPolls.length : polls.length) !== 1 ? 's' : ''})
                </span>
              </h2>
            </div>

            {/* Enhanced Polls Display */}
            {enhancedPolls.length > 0 && (
              <div className="space-y-6">
                {enhancedPolls.map(poll => (
                  <div key={poll._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-700">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{poll.title}</h3>
                      {poll.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{poll.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          🗳️ {poll.totalVotes} total votes
                        </span>
                        {poll.hasUserVoted && (
                          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full">
                            ✓ You voted
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Expires: {new Date(poll.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {poll.proposals?.map((proposal) => {
                        const percentage = poll.totalVotes > 0 ? (proposal.votes / poll.totalVotes * 100) : 0;
                        const isTopVoted = poll.proposals?.length > 0 && 
                                        proposal.votes === Math.max(...poll.proposals.map(p => p.votes)) && 
                                        proposal.votes > 0;
                        
                        return (
                          <div 
                            key={proposal._id}
                            className={`border rounded-xl p-4 transition-all duration-200 cursor-pointer ${
                              poll.hasUserVoted 
                                ? 'cursor-default opacity-75' 
                                : 'hover:shadow-md hover:scale-[1.02]'
                            } ${
                              isTopVoted 
                                ? 'border-green-400 bg-green-50 dark:bg-green-900/20 shadow-md' 
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'
                            }`}
                            onClick={() => !poll.hasUserVoted && voteInPollProposal(poll._id, proposal._id)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                                    {proposal.foodItemId?.name}
                                  </h4>
                                  {isTopVoted && (
                                    <span className="text-green-600 text-lg" title="Leading">
                                      👑
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-bold">
                                    {proposal.proposedDiscount}% OFF
                                  </span>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {proposal.foodItemId?.category}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                                    LKR {proposal.foodItemId?.price?.toFixed(2)}
                                  </span>
                                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                    LKR {((proposal.foodItemId?.price || 0) * (1 - proposal.proposedDiscount / 100)).toFixed(2)}
                                  </span>
                                </div>
                                {proposal.description && proposal.description !== `${proposal.proposedDiscount}% off` && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    "{proposal.description}"
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Votes</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {proposal.votes}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    ({percentage.toFixed(1)}%)
                                  </span>
                                </div>
                              </div>
                              
                              {/* Vote Progress Bar */}
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    isTopVoted ? 'bg-green-500' : 'bg-purple-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>

                            {!poll.hasUserVoted && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                                  Click to vote
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!poll.hasUserVoted && poll.proposals?.length > 0 && (
                      <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-sm">
                        👆 Click on any proposal above to cast your vote for tomorrow's special offer
                      </p>
                    )}

                    {poll.hasUserVoted && (
                      <div className="mt-4 text-center">
                        <p className="text-green-600 dark:text-green-400 font-medium text-sm">
                          ✨ Thank you for voting! Check back tomorrow to see if your choice becomes a special offer.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Legacy Polls Display (for backward compatibility) */}
            {polls.length > 0 && enhancedPolls.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {polls.filter(poll => poll.foodItemId).map(poll => (
                  <div 
                    key={poll._id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200 border border-purple-200 dark:border-purple-700 cursor-pointer hover:scale-[1.02]"
                    onClick={() => voteInPoll(poll.foodItemId._id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {poll.foodItemId.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          LKR {poll.foodItemId.price.toFixed(2)} • {poll.foodItemId.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{poll.votes}</p>
                        <p className="text-sm text-gray-500">votes</p>
                      </div>
                    </div>
                    <p className="text-center text-purple-600 dark:text-purple-400 font-medium text-sm">
                      Click to vote
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="text-xl">🍽️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Browse Menu</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getCategoryItems(activeCategory).length} items available
                </p>
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by:
              </label>
              <div className="relative">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-w-[180px]"
                >
                  {categories.map(category => {
                    const items = category === 'all' ? 
                      categories.slice(1).reduce((total, cat) => total + (menu?.categorizedMenu[cat]?.length || 0), 0) :
                      getCategoryItems(category).length;
                    
                    return (
                      <option key={category} value={category}>
                        {category === 'all' ? '🍽️ All Menu' : 
                         category === 'breakfast' ? '🥐 Breakfast' :
                         category === 'lunch' ? '🍱 Lunch' :
                         category === 'dinner' ? '🍽️ Dinner' :
                         category === 'snack' ? '🍿 Snacks' :
                         category === 'drink' ? '🥤 Drinks' : category.charAt(0).toUpperCase() + category.slice(1)
                        } ({items})
                      </option>
                    );
                  })}
                  {menu.comboMeals.length > 0 && (
                    <option value="combos">
                      🍱 Combo Meals ({menu.comboMeals.length})
                    </option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Quick Filter Chips */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveCategory('breakfast')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === 'breakfast'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🥐 
                </button>
                <button
                  onClick={() => setActiveCategory('lunch')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === 'lunch'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🍱
                </button>
                <button
                  onClick={() => setActiveCategory('dinner')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === 'dinner'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🍽️
                </button>
                {menu.comboMeals.length > 0 && (
                  <button
                    onClick={() => setActiveCategory('combos')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeCategory === 'combos'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    🍱
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-8">
          {/* Food Items by Category */}
          {activeCategory !== 'combos' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 px-8 py-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-2xl font-bold capitalize text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <span className="text-2xl">
                      {activeCategory === 'all' && '🍽️'}
                      {activeCategory === 'breakfast' && '🥐'}
                      {activeCategory === 'lunch' && '🍱'}
                      {activeCategory === 'dinner' && '🍛'}
                      {activeCategory === 'snack' && '🍿'}
                      {activeCategory === 'drink' && '🥤'}
                    </span>
                  </div>
                  {activeCategory === 'all' ? 'Our Full Menu' : `${activeCategory} Menu`}
                  <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                    ({getCategoryItems(activeCategory).length} {activeCategory === 'all' ? 'total items' : `${activeCategory} options`})
                  </span>
                </h2>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {getCategoryItems(activeCategory).map(item => (
                    <div key={item._id} className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/20">
                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          {/* Item Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-2xl bg-gray-50 dark:bg-gray-700 p-2 rounded-xl">
                                {item.category === 'breakfast' && '🥐'}
                                {item.category === 'lunch' && '🍱'}
                                {item.category === 'dinner' && '🍽️'}
                                {item.category === 'snack' && '🍿'}
                                {item.category === 'drink' && '🥤'}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-tight">
                                  {item.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                  {item.category}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Available'
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                          }`}>
                            {item.status}
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Price</p>
                              <p className="text-3xl font-bold text-primary">
                                LKR {item.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Now</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="px-6 pb-6">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={item.status !== 'Available'}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:bg-transparent"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span className="text-sm">Add to Cart</span>
                          </button>
                          
                          <button
                            onClick={() => handleOrderNow(item)}
                            disabled={item.status !== 'Available' || orderingItem?._id === item._id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-sm"
                          >
                            {orderingItem?._id === item._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white dark:border-gray-200 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Ordering...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                <span className="text-sm">Order Now</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {getCategoryItems(activeCategory).length === 0 && (
                  <div className="text-center py-20">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-12 border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <div className="text-gray-300 dark:text-gray-600 text-6xl mb-6">🍽️</div>
                      <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-3">
                        {activeCategory === 'all' 
                          ? 'No Menu Items Available' 
                          : `No ${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Options Available`}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-md mx-auto">
                        {activeCategory === 'all' 
                          ? 'This restaurant is currently updating their menu. Please check back soon for delicious options!' 
                          : `No ${activeCategory} items are currently available. Try browsing other categories or check our full menu.`}
                      </p>
                      {activeCategory !== 'all' && (
                        <button 
                          onClick={() => setActiveCategory('all')} 
                          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <span>🍽️</span>
                          View Full Menu
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Combo Meals */}
          {activeCategory === 'combos' && menu.comboMeals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  Combo Meals
                  <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">
                    ({menu.comboMeals.length} combos)
                  </span>
                </h2>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {menu.comboMeals.map(combo => (
                    <div key={combo._id} className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/20">
                      {/* Header Section */}
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          {/* Combo Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-2xl bg-orange-50 dark:bg-orange-900/30 p-2 rounded-xl">
                                🍱
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors leading-tight">
                                  {combo.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Combo Meal
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            combo.status === 'Available'
                              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                          }`}>
                            {combo.status}
                          </div>
                        </div>

                        {/* Price Section */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Combo Price</p>
                              <p className="text-3xl font-bold text-primary">
                                LKR {combo.totalPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-600 dark:text-green-400 mb-1">You Save</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                LKR {Math.max(0, combo.items.reduce((sum, item) => sum + item.price, 0) - combo.totalPrice).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Items Included */}
                        <div className="space-y-3 mb-5">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <span className="text-base">📋</span>
                            Includes ({combo.items.length} items):
                          </p>
                          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
                            {combo.items.map((item, index) => (
                              <div key={item._id} className={`flex justify-between items-center px-4 py-3 ${
                                index !== combo.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                              }`}>
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">LKR {item.price.toFixed(2)}</span>
                              </div>
                            ))}
                            
                            {/* Total Comparison */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Individual total:</span>
                                <span className="line-through text-gray-500 dark:text-gray-500">
                                  LKR {combo.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm font-semibold">
                                <span className="text-primary">Combo price:</span>
                                <span className="text-primary">
                                  LKR {combo.totalPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions Section */}
                      <div className="px-6 pb-6">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAddToCart(combo, true)}
                            disabled={combo.status !== 'Available'}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-700 disabled:hover:bg-transparent"
                          >
                            <ShoppingCart className="h-4 w-4" />
                            <span className="text-sm">Add to Cart</span>
                          </button>
                          
                          <button
                            onClick={() => handleOrderNow(combo, true)}
                            disabled={combo.status !== 'Available' || orderingItem?._id === combo._id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:shadow-sm"
                          >
                            {orderingItem?._id === combo._id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">Ordering...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                <span className="text-sm">Order Combo</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-primary dark:text-gray-100">
                Rate {restaurant.shopName}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1">
                    <StarRating 
                      rating={userRating} 
                      onRatingChange={setUserRating}
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      {userRating > 0 && `${userRating} star${userRating !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={submitRating}
                    disabled={userRating === 0}
                    className="flex-1"
                  >
                    Submit Rating
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowRatingModal(false);
                      setUserRating(0);
                      setRatingComment('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Enhanced Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Vote for Tomorrow's Specials</h2>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPollModal(false)}
                  size="sm"
                >
                  ✕
                </Button>
              </div>

              {/* Enhanced Polls */}
              {enhancedPolls.length > 0 && (
                <div className="space-y-6">
                  {enhancedPolls.map(poll => (
                    <div key={poll._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold">{poll.title}</h3>
                        {poll.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{poll.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-blue-600 font-medium">
                            {poll.totalVotes} total votes
                          </span>
                          {poll.hasUserVoted && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              You voted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {poll.proposals?.map((proposal) => {
                          const percentage = poll.totalVotes > 0 ? (proposal.votes / poll.totalVotes * 100) : 0;
                          const isTopVoted = poll.proposals?.length > 0 && 
                                          proposal.votes === Math.max(...poll.proposals.map(p => p.votes)) && 
                                          proposal.votes > 0;
                          
                          return (
                            <div 
                              key={proposal._id}
                              className={`border rounded-lg p-3 transition-all duration-200 ${
                                poll.hasUserVoted 
                                  ? 'cursor-default' 
                                  : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              } ${
                                isTopVoted 
                                  ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                                  : 'border-gray-200 dark:border-gray-700'
                              }`}
                              onClick={() => !poll.hasUserVoted && voteInPollProposal(poll._id, proposal._id)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">
                                      {proposal.foodItemId?.name}
                                    </h4>
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                      {proposal.proposedDiscount}% OFF
                                    </span>
                                    {isTopVoted && (
                                      <span className="text-green-600">
                                        👑
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    LKR {proposal.foodItemId?.price?.toFixed(2)} • {proposal.foodItemId?.category}
                                  </p>
                                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                                    Final Price: LKR {((proposal.foodItemId?.price || 0) * (1 - proposal.proposedDiscount / 100)).toFixed(2)}
                                  </p>
                                  {proposal.description && proposal.description !== `${proposal.proposedDiscount}% off` && (
                                    <p className="text-xs text-gray-500 mt-1 italic">
                                      "{proposal.description}"
                                    </p>
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-lg font-bold text-blue-600">{proposal.votes}</div>
                                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                                </div>
                              </div>
                              
                              {/* Vote Progress Bar */}
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isTopVoted ? 'bg-green-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {!poll.hasUserVoted && poll.proposals?.length > 0 && (
                        <p className="text-center text-sm text-gray-500 mt-3">
                          Click on any proposal to vote
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Legacy Polls (for backward compatibility) */}
              {polls.length > 0 && enhancedPolls.length === 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Available Polls</h3>
                  <div className="space-y-3">
                    {polls.filter(poll => poll.foodItemId).map(poll => (
                      <div 
                        key={poll._id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => voteInPoll(poll.foodItemId._id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{poll.foodItemId.name}</p>
                            <p className="text-sm text-secondary dark:text-gray-400">
                              LKR {poll.foodItemId.price.toFixed(2)} • {poll.foodItemId.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">{poll.votes}</p>
                            <p className="text-xs text-secondary dark:text-gray-400">votes</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Polls Message */}
              {polls.length === 0 && enhancedPolls.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <Vote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  </div>
                  <p className="text-gray-500">No active polls at the moment</p>
                  <p className="text-sm text-gray-400">Check back later for new voting opportunities!</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setShowPollModal(false)}
                className="w-full mt-6"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default RestaurantDetail;
