import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Tag, Star, Store, Percent, DollarSign, Gift, TrendingUp, ShoppingCart } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useCart } from '../contexts/CartContext';
import { downloadOrderPDF } from '../utils/pdfGenerator';
import api from '../services/api';
import toast from 'react-hot-toast';

const AllOffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
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
        toast.success('📄 Receipt downloaded successfully!', {
          duration: 3000,
        });
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
      const cartItem = {
        id: offer.foodItemId._id,
        name: offer.foodItemId.name,
        originalPrice: originalPrice,
        price: discountedPrice,
        restaurantId: offer.restaurantId._id,
        restaurantName: offer.restaurantId.shopName,
        isCombo: false,
        isOffer: true,
        discountPercent: offer.discountPercent
      };

      addToCart(cartItem);
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
    { id: 'all', label: 'All Offers', icon: Gift, color: 'bg-primary' },
    { id: 'Main Course', label: 'Main Course', icon: Star, color: 'bg-green-600' },
    { id: 'Appetizer', label: 'Appetizers', icon: Percent, color: 'bg-blue-600' },
    { id: 'Dessert', label: 'Desserts', icon: TrendingUp, color: 'bg-purple-600' },
    { id: 'Beverage', label: 'Beverages', icon: DollarSign, color: 'bg-orange-600' }
  ];

  const filteredOffers = offers.filter(offer => {
    if (selectedCategory === 'all') return true;
    return offer.foodItemId?.category === selectedCategory;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto mb-6"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Loading Offers</h3>
              <p className="text-gray-500 dark:text-gray-400">Discovering the best deals for you...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <Card className="p-8 text-center max-w-md shadow-soft-lg">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unable to Load Offers</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <Button 
                onClick={fetchAllOffers} 
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2"
              >
                Try Again
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Decorative Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-full mb-6">
              <Gift className="w-10 h-10 text-accent" />
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Exclusive Restaurant
              <span className="block text-accent">Offers & Deals</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              Discover amazing discounts and special deals from your favorite restaurants. 
              Save more, eat better!
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
                <div className="text-2xl font-bold text-accent">{offers.length}</div>
                <div className="text-primary-200 text-sm">Active Offers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
                <div className="text-2xl font-bold text-accent">
                  {new Set(offers.map(offer => offer.restaurantId?._id)).size}
                </div>
                <div className="text-primary-200 text-sm">Partner Restaurants</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
                <div className="text-2xl font-bold text-accent">Up to 50%</div>
                <div className="text-primary-200 text-sm">Max Savings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Categories */}
        <div className="mb-8">
          <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-soft p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Filter by Category
            </h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                      ${isActive
                        ? `${category.color} text-white shadow-lg transform scale-105`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
                      }
                    `}
                  >
                    <IconComponent className="w-4 h-4" />
                    {category.label}
                    {isActive && filteredOffers.length > 0 && (
                      <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full ml-1">
                        {filteredOffers.length}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        {filteredOffers.length === 0 ? (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto p-8 shadow-soft-lg border border-gray-200 dark:border-gray-700">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                No Offers Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {selectedCategory === 'all' 
                  ? 'There are currently no active offers available. Check back soon for exciting deals!'
                  : `No offers found in the "${categories.find(c => c.id === selectedCategory)?.label}" category. Try browsing other categories.`
                }
              </p>
              {selectedCategory !== 'all' && (
                <Button 
                  onClick={() => setSelectedCategory('all')} 
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2"
                >
                  View All Offers
                </Button>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => (
              <Card 
                key={offer._id} 
                className="overflow-hidden hover:shadow-soft-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 group hover:-translate-y-1"
              >
                {/* Offer Header with Restaurant */}
                <div className="bg-gradient-to-br from-primary via-primary-600 to-primary-700 text-white p-6 relative overflow-hidden">
                  {/* Background Pattern */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8zm0-20c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z'/%3E%3C/g%3E%3C/svg%3E")`
                    }}
                  ></div>
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                          <Store className="h-4 w-4 text-accent" />
                        </div>
                        <span className="font-semibold text-sm text-primary-100">
                          {offer.restaurantId?.shopName || 'Restaurant'}
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border bg-green-50 border-green-200 text-green-700`}>
                        {offer.discountPercent}% OFF
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold mb-2 text-accent">
                      {offer.discountPercent}% OFF
                    </div>
                    
                    {offer.restaurantId?.location && (
                      <div className="flex items-center gap-1 text-primary-200 text-sm">
                        <MapPin className="h-3 w-3" />
                        <span>{offer.restaurantId.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offer Content */}
                <div className="p-6 bg-surface dark:bg-surface-dark">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">
                    {offer.foodItemId?.name || 'Special Offer'}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-red-500 line-through">
                        ${offer.foodItemId?.price}
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        ${(offer.foodItemId?.price - (offer.foodItemId?.price * offer.discountPercent / 100)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Save ${(offer.foodItemId?.price * offer.discountPercent / 100).toFixed(2)} on this delicious {offer.foodItemId?.category || 'item'}!
                    </p>
                  </div>

                  {/* Offer Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>
                        Valid until: {new Date(offer.validDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
                        Category: {offer.foodItemId?.category || 'Food'}
                      </div>
                      
                      <div className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full">
                        {offer.discountPercent}% Discount
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleOrderNow(offer)}
                      disabled={orderingItem?.foodItemId?._id === offer.foodItemId?._id}
                      className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-xl transition-all duration-200 group-hover:shadow-lg"
                    >
                      {orderingItem?.foodItemId?._id === offer.foodItemId?._id ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <span>Order Now</span>
                          <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={() => handleAddToCart(offer)}
                      variant="outline"
                      className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold py-3 rounded-xl transition-all duration-200"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      <span>Add to Cart</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {filteredOffers.length > 0 && (
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 border border-accent/20 shadow-soft-lg">
              <div className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Savings Summary
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your current offers overview
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center bg-surface dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Gift className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">{filteredOffers.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Total Active Offers
                    </div>
                  </div>
                  
                  <div className="text-center bg-surface dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Store className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {new Set(offers.map(offer => offer.restaurantId?._id)).size}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Partner Restaurants</div>
                  </div>
                  
                  <div className="text-center bg-surface dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Percent className="w-6 h-6 text-accent-dark" />
                    </div>
                    <div className="text-3xl font-bold text-accent-dark mb-1">
                      {offers.length > 0 ? Math.round(offers.reduce((sum, offer) => sum + (offer.discountPercent || 0), 0) / offers.length) : 0}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Average Discount</div>
                  </div>
                  
                  <div className="text-center bg-surface dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-600">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      ${Math.round(offers.reduce((sum, offer) => {
                        if (offer.foodItemId?.price && offer.discountPercent) {
                          return sum + (offer.foodItemId.price * offer.discountPercent / 100);
                        }
                        return sum;
                      }, 0))}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Potential Savings</div>
                  </div>
                </div>
                
                <div className="text-center mt-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    🎯 Start exploring these amazing deals and save on your next order!
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOffersPage;