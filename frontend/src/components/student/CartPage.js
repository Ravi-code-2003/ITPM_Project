import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingCart, X, Store, CreditCard, Trash2, Download } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useCart } from '../../contexts/CartContext';
import { downloadOrderPDF } from '../../utils/pdfGenerator';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CartPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartCount } = useCart();
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (itemId, isCombo, change) => {
    updateQuantity(itemId, isCombo, change);
  };

  const handleRemoveItem = (itemId, isCombo) => {
    removeFromCart(itemId, isCombo);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!cart.restaurantId) {
      toast.error('Restaurant information is missing');
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.items.map(item => ({
        [item.isCombo ? 'comboMealId' : 'foodItemId']: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const orderData = {
        restaurantId: cart.restaurantId,
        items: orderItems,
        totalAmount: getCartTotal()
      };

      const response = await api.post('/student/orders', orderData);
      
      if (response.data.success) {
        toast.success('Order placed successfully!');
        
        // Prepare data for receipt auto-download
        const receiptData = {
          _id: response.data.order._id,
          orderNumber: response.data.order._id?.slice(-8).toUpperCase() || 'N/A',
          items: cart.items,
          totalAmount: getCartTotal(),
          restaurant: {
            name: cart.restaurantName,
            location: response.data.order.restaurantId?.location || 'Location not specified'
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
          icon: '🧾'
        });
        
        // Clear cart after successful order
        clearCart();
        
        // Navigate back to restaurants after a short delay
        setTimeout(() => {
          navigate('/restaurants');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueShopping = () => {
    if (cart.restaurantId) {
      navigate(`/restaurants/${cart.restaurantId}`);
    } else {
      navigate('/restaurants');
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="text-center py-20 px-8">
              <div className="bg-gray-100 dark:bg-gray-700 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Your Cart is Empty
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-10 text-xl max-w-md mx-auto leading-relaxed">
                Add some delicious items from our restaurants to get started on your food journey!
              </p>
              <Button 
                onClick={() => navigate('/restaurants')}
                className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white px-10 py-4 rounded-xl text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Store className="h-6 w-6 mr-3" />
                Explore Restaurants
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Professional Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full">
                <ShoppingCart className="h-8 w-8 text-primary dark:text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Shopping Cart
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-lg">
                  <span className="font-semibold text-primary">{getCartCount()}</span> items from <span className="font-medium">{cart.restaurantName}</span>
                </p>
              </div>
            </div>
            <Button
              onClick={handleClearCart}
              variant="outline" 
              className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20 px-6 py-3"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg mr-3">
                    <ShoppingCart className="h-6 w-6 text-primary" />
                  </div>
                  Order Items
                </h2>
                
                <div className="space-y-6">
                  {cart.items.map((item) => (
                    <div key={`${item.id}-${item.isCombo}`} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          {item.isCombo && (
                            <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                              COMBO
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 capitalize font-medium">
                          <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded text-xs mr-2">{item.category}</span>
                          <span className="text-primary dark:text-accent font-semibold">${item.price.toFixed(2)}</span> each
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-500 p-1 shadow-sm">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.isCombo, -1)}
                            className="h-10 w-10 p-0 text-gray-600 hover:text-white dark:text-gray-300 dark:hover:text-white hover:bg-primary dark:hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-200 font-bold"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <span className="font-bold min-w-[3rem] text-center text-gray-900 dark:text-white px-3 text-lg">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.isCombo, 1)}
                            className="h-10 w-10 p-0 text-gray-600 hover:text-white dark:text-gray-300 dark:hover:text-white hover:bg-primary dark:hover:bg-primary rounded-lg flex items-center justify-center transition-all duration-200 font-bold"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {/* Item Total */}
                        <div className="text-xl font-bold text-primary dark:text-accent min-w-[5rem] text-right bg-gray-100 dark:bg-gray-600 px-3 py-2 rounded-lg">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id, item.isCombo)}
                          className="text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:text-white dark:hover:bg-red-600 h-10 w-10 p-0 rounded-lg flex items-center justify-center border-2 border-red-200 hover:border-red-600 dark:border-red-400/30 transition-all duration-200 shadow-sm"
                          title="Remove item"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 sticky top-6">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg mr-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  Order Summary
                </h2>
                
                {/* Restaurant Info */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-xl p-6 mb-8 border border-primary/20">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-full">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900 dark:text-white">
                        {cart.restaurantName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        <span className="text-primary font-semibold">{getCartCount()}</span> items selected
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between py-2 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-4 mt-4">
                    <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span className="text-primary dark:text-accent">${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading || cart.items.length === 0}
                    fullWidth
                    className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white py-4 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-6 w-6 mr-3" />
                        <span className="text-white dark:text-white">Place Order • ${getCartTotal().toFixed(2)}</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleContinueShopping}
                    variant="outline"
                    fullWidth
                    className="py-4 text-lg font-semibold border-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
                  >
                    <Store className="h-5 w-5 mr-3" />
                    Continue Shopping
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="text-center text-sm text-green-700 dark:text-green-400 font-medium flex items-center justify-center">
                    � <span className="ml-2">Simple and fast ordering</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;