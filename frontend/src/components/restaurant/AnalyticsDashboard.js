import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, DollarSign, ShoppingBag, Users, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/shop/analytics?period=${period}`);
      setAnalytics(response.data.analytics);
    } catch (error) {
      toast.error('Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Analytics Dashboard</h2>
          <p className="text-secondary dark:text-gray-400">Track your restaurant performance</p>
        </div>
        
        <div className="flex gap-2">
          {['7', '30', '90'].map(days => (
            <Button
              key={days}
              size="sm"
              variant={period === days ? 'default' : 'outline'}
              onClick={() => setPeriod(days)}
            >
              {days} Days
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {analytics.totalOrders}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                <ShoppingBag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  LKR {analytics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Avg Order Value</p>
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  LKR {analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary dark:text-gray-400">Period</p>
                <p className="text-2xl font-bold text-primary dark:text-gray-100">
                  {analytics.period}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.popularItems.length > 0 ? (
              <div className="space-y-3">
                {analytics.popularItems.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          #{index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-primary dark:text-gray-100">
                          {item.name}
                        </p>
                        <p className="text-sm text-secondary dark:text-gray-400 capitalize">
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary dark:text-gray-100">
                        {item.orderCount}
                      </p>
                      <p className="text-xs text-secondary dark:text-gray-400">
                        orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No order data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Daily Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.dailySales.length > 0 ? (
              <div className="space-y-2">
                {analytics.dailySales.slice(-7).map((day) => (
                  <div key={day._id} className="flex items-center justify-between">
                    <span className="text-sm text-secondary dark:text-gray-400">
                      {new Date(day._id).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-primary dark:text-gray-100">
                        {day.orders} orders
                      </span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        LKR {day.sales.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No sales data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AnalyticsDashboard;