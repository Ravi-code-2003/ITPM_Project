import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Store, Percent, DollarSign, Gift, TrendingUp, ShoppingCart, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { downloadOrderPDF } from '../utils/pdfGenerator';
import api from '../services/api';
import toast from 'react-hot-toast';

const AllOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderingItem, setOrderingItem] = useState(null);
  const { addToCart } = useCart();

  // Handle immediate order with auto-download receipt for offers
  const handleOrderNow = async (offer) => {
    if (!offer.foodItemId) {
      toast.error('Food item information not available');
      return;
    }

    setOrderingItem(offer);
    try {
      console.log('Processing order for offer:', offer);
      
      // Calculate discounted price
      const originalPrice = offer.foodItemId.price;
      const discountedPrice = originalPrice - (originalPrice * offer.discountPercent / 100);
      
      // Create order data for single item with discount
      const orderData = {
        restaurantId: offer.restaurantId._id,
        items: [{
          foodItemId: offer.foodItemId._id,
          quantity: 1,
          price: discountedPrice
        }],
        totalAmount: discountedPrice
      };

      console.log('Sending order data:', orderData);
      const response = await api.post('/student/orders', orderData);
      
      if (response.data.success) {
        toast.success('Order placed successfully!');
        
        // Prepare data for receipt download
        const receiptData = {
          _id: response.data.order._id,
          orderNumber: response.data.order._id?.slice(-8).toUpperCase() || 'N/A',
          items: [{
            id: offer.foodItemId._id,
            name: offer.foodItemId.name,
            originalPrice: originalPrice,
            price: discountedPrice,
            discountedPrice: discountedPrice,
            quantity: 1,
            isCombo: false
          }],
          totalAmount: discountedPrice,
          restaurant: {
            name: offer.restaurantId?.shopName || 'Restaurant',
            location: offer.restaurantId?.location || 'Location not specified'
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
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setOrderingItem(null);
    }
  };

  // Handle add to cart for offers
  const handleAddToCart = (offer) => {
    if (!offer.foodItemId) {
      toast.error('Food item information not available');
      return;
    }

    try {
      console.log('Adding offer to cart:', offer);
      
      // Calculate discounted price
      const originalPrice = offer.foodItemId.price;
      const discountedPrice = originalPrice - (originalPrice * offer.discountPercent / 100);
      
      // Prepare cart item with discount information
      // Must use _id so the cart reducer can identify the item correctly
      const cartItem = {
        _id: offer.foodItemId._id,
        name: offer.foodItemId.name,
        originalPrice: originalPrice,
        price: discountedPrice,
        category: offer.foodItemId.category,
        isOffer: true,
        discountPercent: offer.discountPercent
      };

      addToCart(cartItem, false, offer.restaurantId._id, offer.restaurantId.shopName);
      toast.success(`${offer.foodItemId.name} added to cart with ${offer.discountPercent}% discount!`);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('Failed to add item to cart');
    }
  };

  useEffect(() => {
    fetchAllOffers();
  }, []);

  const fetchAllOffers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/offers');
      setOffers(response.data.offers || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      setError('Failed to load offers');
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All', emoji: '🎁' },
    { id: 'breakfast', label: 'Breakfast', emoji: '🥐' },
    { id: 'lunch', label: 'Lunch', emoji: '🍱' },
    { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
    { id: 'snack', label: 'Snacks', emoji: '🍿' },
    { id: 'drink', label: 'Drinks', emoji: '🥤' },
    { id: 'Main Course', label: 'Main Course', emoji: '🥘' },
    { id: 'Dessert', label: 'Desserts', emoji: '🍰' },
  ];

  const filteredOffers = offers.filter(offer => {
    const matchesCategory = selectedCategory === 'all' || offer.foodItemId?.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      offer.foodItemId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.restaurantId?.shopName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getOfferStats = () => {
    const totalOffers = offers.length;
    const totalSavings = offers.reduce((sum, offer) => {
      if (offer.foodItemId?.price && offer.discountPercent) {
        return sum + (offer.foodItemId.price * offer.discountPercent / 100);
      }
      return sum;
    }, 0);
    const avgDiscount = offers.length > 0 ? 
      offers.reduce((sum, offer) => sum + (offer.discountPercent || 0), 0) / offers.length : 0;
    const restaurantCount = new Set(offers.map(offer => offer.restaurantId?._id)).size;

    return { totalOffers, totalSavings, avgDiscount, restaurantCount };
  };

  const getCategoryEmoji = (category) => {
    const map = { breakfast: '🥐', lunch: '🍱', dinner: '🍽️', snack: '🍿', drink: '🥤', 'Main Course': '🍖', Dessert: '🍰', Appetizer: '🥗', Beverage: '🧃' };
    return map[category] || '🍴';
  };

  const getDiscountColor = (pct) => {
    if (pct >= 40) return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', light: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' };
    if (pct >= 25) return { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', light: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' };
    return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400', light: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' };
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <p className="text-secondary dark:text-gray-400 font-medium">Loading offers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Offers</h3>
        <p className="text-secondary dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchAllOffers}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary-600 to-primary-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-20 pointer-events-none select-none">🎁</div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wide">Special Deals</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Exclusive Offers &amp; Discounts</h2>
          <p className="text-white/80 text-sm">Save big on your favourite meals today</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              <Gift className="w-4 h-4" />
              <span className="text-sm font-semibold">{offers.length} Active Offers</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              <Store className="w-4 h-4" />
              <span className="text-sm font-semibold">{new Set(offers.map(o => o.restaurantId?._id)).size} Restaurants</span>
            </div>
            {offers.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">Up to {Math.max(...offers.map(o => o.discountPercent || 0))}% OFF</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search + Filter Row */}
      <div className="bg-background dark:bg-surface-dark rounded-xl border border-accent/50 dark:border-gray-700 p-4 shadow-soft">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search offers or restaurants..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-accent/60 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const count = cat.id === 'all'
              ? offers.filter(o => searchQuery === '' || o.foodItemId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || o.restaurantId?.shopName?.toLowerCase().includes(searchQuery.toLowerCase())).length
              : offers.filter(o => o.foodItemId?.category === cat.id && (searchQuery === '' || o.foodItemId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || o.restaurantId?.shopName?.toLowerCase().includes(searchQuery.toLowerCase()))).length;
            if (cat.id !== 'all' && count === 0) return null;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-accent/40 dark:border-gray-700 hover:bg-accent/20 dark:hover:bg-gray-700'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-accent/40 dark:bg-gray-700 text-primary dark:text-gray-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || selectedCategory !== 'all') && (
        <p className="text-sm text-secondary dark:text-gray-400">
          Showing <span className="font-semibold text-primary dark:text-white">{filteredOffers.length}</span> offer{filteredOffers.length !== 1 ? 's' : ''}
          {searchQuery && <> for "<span className="font-medium">{searchQuery}</span>"</>}
        </p>
      )}

      {/* Offers Grid */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-16 bg-background dark:bg-surface-dark rounded-xl border border-accent/50 dark:border-gray-700">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Offers Found</h3>
          <p className="text-secondary dark:text-gray-400 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `No offers match "${searchQuery}". Try a different search.`
              : selectedCategory === 'all'
                ? 'There are currently no active offers. Check back soon!'
                : `No offers in this category. Try browsing others.`
            }
          </p>
          <div className="flex gap-3 justify-center">
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
            )}
            {selectedCategory !== 'all' && (
              <Button onClick={() => setSelectedCategory('all')}>View All Offers</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const discountColors = getDiscountColor(offer.discountPercent);
            const originalPrice = offer.foodItemId?.price || 0;
            const discountedPrice = originalPrice - (originalPrice * offer.discountPercent / 100);
            const savings = originalPrice * offer.discountPercent / 100;
            const isOrdering = orderingItem?.foodItemId?._id === offer.foodItemId?._id;

            return (
              <div
                key={offer._id}
                className="bg-surface dark:bg-surface-dark rounded-xl border border-accent/40 dark:border-gray-700 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Card Top: emoji + discount badge */}
                <div className="relative bg-gradient-to-br from-background to-accent/20 dark:from-gray-800 dark:to-gray-700 p-5 flex items-center gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-900/50 rounded-2xl flex items-center justify-center text-4xl shadow-sm flex-shrink-0">
                    {getCategoryEmoji(offer.foodItemId?.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-2">
                      {offer.foodItemId?.name || 'Special Offer'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Store className="w-3.5 h-3.5 text-secondary dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-secondary dark:text-gray-400 truncate">
                        {offer.restaurantId?.shopName || 'Restaurant'}
                      </span>
                    </div>
                  </div>
                  {/* Discount Badge */}
                  <div className={`absolute top-3 right-3 ${discountColors.bg} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow`}>
                    -{offer.discountPercent}%
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col gap-4">
                  {/* Price Section */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-secondary dark:text-gray-400 mb-0.5">Discounted Price</p>
                      <p className={`text-2xl font-bold ${discountColors.text}`}>
                        LKR {discountedPrice.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 line-through">LKR {originalPrice}</p>
                    </div>
                    <div className={`${discountColors.light} text-xs font-semibold px-3 py-1.5 rounded-full`}>
                      Save LKR {savings.toFixed(2)}
                    </div>
                  </div>

                  {/* Meta Row */}
                  <div className="flex items-center justify-between text-xs text-secondary dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{getCategoryEmoji(offer.foodItemId?.category)}</span>
                      <span className="capitalize">{offer.foodItemId?.category || 'Food'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Valid until {new Date(offer.validDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {offer.restaurantId?.location && (
                    <div className="flex items-center gap-1.5 text-xs text-secondary dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{offer.restaurantId.location}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <Button
                      onClick={() => handleAddToCart(offer)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1.5" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleOrderNow(offer)}
                      disabled={isOrdering}
                      size="sm"
                      className="flex-1"
                    >
                      {isOrdering ? (
                        <span className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : 'Order Now'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Stats Bar */}
      {filteredOffers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-background dark:bg-surface-dark rounded-xl border border-accent/50 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{filteredOffers.length}</p>
              <p className="text-xs text-secondary dark:text-gray-400">Active Offers</p>
            </div>
          </div>
          <div className="bg-background dark:bg-surface-dark rounded-xl border border-accent/50 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{new Set(offers.map(o => o.restaurantId?._id)).size}</p>
              <p className="text-xs text-secondary dark:text-gray-400">Restaurants</p>
            </div>
          </div>
          <div className="bg-background dark:bg-surface-dark rounded-xl border border-accent/50 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Percent className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {offers.length > 0 ? Math.round(offers.reduce((s, o) => s + (o.discountPercent || 0), 0) / offers.length) : 0}%
              </p>
              <p className="text-xs text-secondary dark:text-gray-400">Avg. Discount</p>
            </div>
          </div>
          <div className="bg-background dark:bg-surface-dark rounded-xl border border-accent/50 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                LKR {Math.round(offers.reduce((s, o) => s + ((o.foodItemId?.price || 0) * (o.discountPercent || 0) / 100), 0))}
              </p>
              <p className="text-xs text-secondary dark:text-gray-400">Total Savings</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllOffersPage;