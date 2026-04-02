import React, { useEffect, useMemo, useState } from 'react';
import { Box, MapPin, Store, Search, ShoppingCart, Layers } from 'lucide-react';
import Button from '../components/ui/Button';
import { useCart } from '../contexts/CartContext';
import { downloadOrderPDF } from '../utils/pdfGenerator';
import api from '../services/api';
import toast from 'react-hot-toast';

const AllCombosPage = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [orderingComboId, setOrderingComboId] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchAllCombos();
  }, []);

  const fetchAllCombos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/student/combos');
      setCombos(response.data.combos || []);
    } catch (fetchError) {
      console.error('Error fetching combos:', fetchError);
      setError('Failed to load combo meals');
      toast.error('Failed to load combo meals');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (combo) => {
    try {
      addToCart(combo, true, combo.restaurantId?._id, combo.restaurantId?.shopName);
      toast.success(`${combo.name} added to cart`);
    } catch (cartError) {
      console.error('Add to cart error:', cartError);
      toast.error('Failed to add combo to cart');
    }
  };

  const handleOrderNow = async (combo) => {
    if (!combo.restaurantId?._id) {
      toast.error('Restaurant information not available for this combo');
      return;
    }

    setOrderingComboId(combo._id);

    try {
      const orderData = {
        restaurantId: combo.restaurantId._id,
        items: [
          {
            comboMealId: combo._id,
            quantity: 1,
            price: combo.totalPrice
          }
        ],
        totalAmount: combo.totalPrice
      };

      const response = await api.post('/student/orders', orderData);

      if (response.data.success) {
        toast.success('Combo ordered successfully!');

        const receiptData = {
          _id: response.data.order._id,
          orderNumber: response.data.order._id?.slice(-8).toUpperCase() || 'N/A',
          items: [
            {
              id: combo._id,
              name: combo.name,
              price: combo.totalPrice,
              quantity: 1,
              isCombo: true,
              category: 'combo meal'
            }
          ],
          totalAmount: combo.totalPrice,
          restaurant: {
            name: combo.restaurantId?.shopName || 'Restaurant',
            location: combo.restaurantId?.location || 'Location not specified'
          },
          orderDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        downloadOrderPDF(receiptData);
      }
    } catch (orderError) {
      console.error('Combo order error:', orderError);
      toast.error(orderError.response?.data?.message || 'Failed to place combo order');
    } finally {
      setOrderingComboId(null);
    }
  };

  const restaurantOptions = useMemo(() => {
    const map = new Map();
    combos.forEach((combo) => {
      if (combo.restaurantId?._id) {
        map.set(combo.restaurantId._id, combo.restaurantId.shopName || 'Restaurant');
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [combos]);

  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      const matchesRestaurant = selectedRestaurant === 'all' || combo.restaurantId?._id === selectedRestaurant;
      const matchesSearch =
        !searchQuery ||
        combo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        combo.restaurantId?.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        combo.items?.some((item) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesRestaurant && matchesSearch;
    });
  }, [combos, searchQuery, selectedRestaurant]);

  if (loading) {
    return (
      <div className="py-16">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
            <p className="text-secondary dark:text-gray-400 font-medium">Loading combo meals...</p>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unable to Load Combo Meals</h3>
        <p className="text-secondary dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={fetchAllCombos}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-8xl opacity-20 pointer-events-none select-none">🍱</div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-white/80" />
            <span className="text-sm font-medium text-white/80 uppercase tracking-wide">Combo Deals</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">All Restaurant Combo Meals</h2>
          <p className="text-white/80 text-sm">Discover value-packed meals from every restaurant</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              <Box className="w-4 h-4" />
              <span className="text-sm font-semibold">{combos.length} Combos</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              <Store className="w-4 h-4" />
              <span className="text-sm font-semibold">{restaurantOptions.length} Restaurants</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search combo, restaurant, or item..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>

          <select
            value={selectedRestaurant}
            onChange={(event) => setSelectedRestaurant(event.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="all">All Restaurants</option>
            {restaurantOptions.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredCombos.length === 0 ? (
        <div className="text-center py-16 bg-surface dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Combo Meals Found</h3>
          <p className="text-secondary dark:text-gray-400 mb-6 max-w-sm mx-auto">
            Try a different search or restaurant filter to find combo meals.
          </p>
          <div className="flex gap-3 justify-center">
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
            )}
            {selectedRestaurant !== 'all' && (
              <Button onClick={() => setSelectedRestaurant('all')}>Show All Restaurants</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCombos.map((combo) => {
            const itemTotal = combo.items?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
            const savings = Math.max(0, itemTotal - (combo.totalPrice || 0));
            const isOrdering = orderingComboId === combo._id;

            return (
              <div
                key={combo._id}
                className="bg-surface dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-5">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2">
                    {combo.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-secondary dark:text-gray-400">
                    <Store className="w-3.5 h-3.5" />
                    <span>{combo.restaurantId?.shopName || 'Restaurant'}</span>
                  </div>
                  {combo.restaurantId?.location && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-secondary dark:text-gray-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{combo.restaurantId.location}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-secondary dark:text-gray-400 mb-0.5">Combo Price</p>
                      <p className="text-2xl font-bold text-primary">LKR {(combo.totalPrice || 0).toFixed(2)}</p>
                      {itemTotal > 0 && (
                        <p className="text-sm text-gray-400 line-through">LKR {itemTotal.toFixed(2)}</p>
                      )}
                    </div>
                    {savings > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                        Save LKR {savings.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Includes ({combo.items?.length || 0} items)
                    </p>
                    <div className="space-y-1.5">
                      {(combo.items || []).slice(0, 4).map((item) => (
                        <div key={item._id} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-200 truncate">{item.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">LKR {(item.price || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      {(combo.items || []).length > 4 && (
                        <p className="text-xs text-secondary dark:text-gray-400">
                          +{combo.items.length - 4} more item(s)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-1">
                    <Button
                      onClick={() => handleAddToCart(combo)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1.5" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={() => handleOrderNow(combo)}
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
    </div>
  );
};

export default AllCombosPage;
