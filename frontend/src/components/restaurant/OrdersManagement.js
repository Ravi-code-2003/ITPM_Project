import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Filter, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'ready', 'completed', 'cancelled'];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const response = await api.get(`/shop/orders?${params.toString()}`);
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch orders');
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending':   return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'ready':     return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:          return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/shop/orders/${orderId}/status`, { status: newStatus });
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Orders</h2>
          <p className="text-secondary dark:text-gray-400">
            Manage and track student orders
          </p>
        </div>
        <Button variant="outline" onClick={fetchOrders} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'ready', 'completed'].map(s => (
          <Card key={s}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary dark:text-gray-400 capitalize">{s}</p>
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {orders.filter(o => o.status === s).length}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getOrderStatusColor(s)}`}>
                {s}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-secondary dark:text-gray-400" />
        {STATUS_OPTIONS.map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className="capitalize"
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Orders list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {statusFilter === 'all' ? 'All Orders' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`}
            <span className="text-sm font-normal text-secondary dark:text-gray-400">
              ({pagination.totalOrders} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {/* Item names — prominent */}
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => {
                      const name = item.foodItemId?.name || item.comboMealId?.name || 'Item';
                      const price = item.price ?? item.foodItemId?.price ?? item.comboMealId?.totalPrice ?? 0;
                      return (
                        <div key={idx} className="flex justify-between items-baseline">
                          <span className="text-base font-semibold text-primary dark:text-gray-100">
                            {name} <span className="text-sm font-normal text-secondary dark:text-gray-400">× {item.quantity}</span>
                          </span>
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            LKR {(price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order meta */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs text-secondary dark:text-gray-400">
                        #{order.orderNumber || order._id?.slice(-8).toUpperCase()} • {order.studentId?.fullName}
                      </p>
                      <p className="text-xs text-secondary dark:text-gray-400">
                        {order.studentId?.email} • {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        LKR {order.totalAmount.toFixed(2)}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Status actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {['pending', 'confirmed', 'ready', 'completed'].map(status => (
                      <Button
                        key={status}
                        size="sm"
                        variant={order.status === status ? 'default' : 'outline'}
                        onClick={() => updateOrderStatus(order._id, status)}
                        disabled={order.status === status || order.status === 'cancelled'}
                        className="text-xs capitalize"
                      >
                        {status}
                      </Button>
                    ))}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        className="text-xs text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-secondary dark:text-gray-400">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagement;
