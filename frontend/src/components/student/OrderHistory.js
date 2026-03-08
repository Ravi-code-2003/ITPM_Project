import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Star, Package, Filter, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const statuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await api.get(`/student/orders${params}`);
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (!selectedOrder) return;

    try {
      await api.post('/student/rating', {
        restaurantId: selectedOrder.restaurantId._id,
        rating,
        comment
      });
      
      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setSelectedOrder(null);
      setRating(5);
      setComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'completed': return <Package className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canRate = (order) => {
    return order.status === 'completed' && !order.rated;
  };

  const renderStars = (currentRating, interactive = false, onStarClick = null) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < currentRating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300 dark:text-gray-600'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={() => interactive && onStarClick && onStarClick(i + 1)}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-gray-100">Order History</h1>
          <p className="text-secondary dark:text-gray-400">
            Track your past and current food orders • {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Orders</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order._id} className="p-6">
              <div className="space-y-4">
                {/* Order Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-primary dark:text-gray-100">
                        {order.restaurantId.shopName}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-secondary dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {order.restaurantId.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-secondary dark:text-gray-400">Order #{order.orderNumber}</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      LKR {order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <span className="text-primary dark:text-gray-100">
                            {item.foodItemId?.name || item.comboMealId?.name}
                          </span>
                          <span className="text-sm text-secondary dark:text-gray-400 ml-2">
                            × {item.quantity}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          LKR {item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-secondary dark:text-gray-400">
                      {order.orderType} • Ordered {new Date(order.createdAt).toLocaleString()}
                    </div>
                    
                    <div className="flex gap-3">
                      <Link to={`/student/restaurant/${order.restaurantId._id}`}>
                        <Button size="sm" variant="outline">
                          Order Again
                        </Button>
                      </Link>
                      
                      {canRate(order) && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowRatingModal(true);
                          }}
                        >
                          Rate Restaurant
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl mb-2">
              {statusFilter ? `No ${statusFilter} orders found` : 'No orders yet'}
            </p>
            <p className="mb-6">
              {statusFilter 
                ? 'Try changing the filter to see other orders' 
                : 'Start exploring restaurants and place your first order'}
            </p>
            {!statusFilter && (
              <Link to="/student/restaurants">
                <Button>
                  Browse Restaurants
                </Button>
              </Link>
            )}
            {statusFilter && (
              <Button variant="outline" onClick={() => setStatusFilter('')}>
                Show All Orders
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Rate Your Experience</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    How was your experience at {selectedOrder.restaurantId.shopName}?
                  </p>
                  
                  <div className="flex items-center gap-1 mb-4">
                    {renderStars(rating, true, setRating)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Comment (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                    rows="3"
                    placeholder="Share your thoughts about the food and service..."
                    maxLength="500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {comment.length}/500
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button onClick={submitRating} className="flex-1">
                  Submit Rating
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRatingModal(false);
                    setSelectedOrder(null);
                    setRating(5);
                    setComment('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;