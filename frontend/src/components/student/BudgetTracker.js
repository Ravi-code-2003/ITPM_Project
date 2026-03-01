import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, ShoppingBag, Target, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BudgetTracker = () => {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [showSetBudget, setShowSetBudget] = useState(false);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async (budget = null) => {
    try {
      setLoading(true);
      const params = budget ? `?monthlyBudget=${budget}` : '';
      const response = await api.get(`/student/budget-tracker${params}`);
      setBudgetData(response.data.budgetTracker);
      
      if (!budget && response.data.budgetTracker.monthlyBudget === 0) {
        setShowSetBudget(true);
      }
    } catch (error) {
      toast.error('Failed to fetch budget data');
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setBudget = () => {
    const budget = parseFloat(monthlyBudget);
    if (!budget || budget <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    
    fetchBudgetData(budget);
    setShowSetBudget(false);
    toast.success('Budget set successfully!');
  };

  const getBudgetStatus = () => {
    if (!budgetData || budgetData.monthlyBudget === 0) return 'no-budget';
    
    const percentageUsed = budgetData.percentageUsed;
    if (percentageUsed >= 100) return 'over-budget';
    if (percentageUsed >= 80) return 'warning';
    if (percentageUsed >= 60) return 'caution';
    return 'good';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'caution': return 'text-yellow-600 dark:text-yellow-400';
      case 'warning': return 'text-orange-600 dark:text-orange-400';
      case 'over-budget': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <Target className="h-5 w-5 text-green-600" />;
      case 'caution': return <TrendingUp className="h-5 w-5 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'over-budget': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'good': return 'You\'re doing great! Keep it up!';
      case 'caution': return 'Watch your spending - you\'re over halfway';
      case 'warning': return 'Caution: You\'ve used 80% of your budget';
      case 'over-budget': return 'You\'ve exceeded your monthly budget';
      default: return 'Set a budget to track your spending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const status = getBudgetStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-gray-100">Budget Tracker</h1>
          <p className="text-secondary dark:text-gray-400">Monitor your monthly food spending</p>
        </div>
        
        <Button onClick={() => setShowSetBudget(true)}>
          {budgetData?.monthlyBudget > 0 ? 'Update Budget' : 'Set Budget'}
        </Button>
      </div>

      {/* Set Budget Modal */}
      {showSetBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Set Monthly Budget</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Budget ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                    placeholder="Enter your monthly food budget"
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 Tip: Consider your current spending patterns when setting your budget. 
                    A good rule of thumb is 10-15% of your monthly income for food.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button onClick={setBudget} className="flex-1">
                  Set Budget
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSetBudget(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {budgetData && (
        <>
          {/* Budget Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Monthly Budget</p>
                    <p className="text-2xl font-bold text-primary dark:text-gray-100">
                      ${budgetData.monthlyBudget.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Total Spent</p>
                    <p className="text-2xl font-bold text-primary dark:text-gray-100">
                      ${budgetData.totalSpent.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
                    <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Remaining</p>
                    <p className={`text-2xl font-bold ${getStatusColor(status)}`}>
                      ${Math.max(0, budgetData.remaining).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                    {getStatusIcon(status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-secondary dark:text-gray-400">Orders This Month</p>
                    <p className="text-2xl font-bold text-primary dark:text-gray-100">
                      {budgetData.orderCount}
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                    <ShoppingBag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(status)}
                Budget Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-secondary dark:text-gray-400">Used</span>
                    <span className={getStatusColor(status)}>
                      {budgetData.monthlyBudget > 0 ? budgetData.percentageUsed.toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        status === 'good' ? 'bg-green-500' :
                        status === 'caution' ? 'bg-yellow-500' :
                        status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(budgetData.percentageUsed || 0, 100)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                <div className={`p-3 rounded-lg ${
                  status === 'good' ? 'bg-green-50 dark:bg-green-900/20' :
                  status === 'caution' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  status === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20' :
                  status === 'over-budget' ? 'bg-red-50 dark:bg-red-900/20' :
                  'bg-gray-50 dark:bg-gray-900/20'
                }`}>
                  <p className={`text-sm ${getStatusColor(status)}`}>
                    {getStatusMessage(status)}
                  </p>
                </div>

                {budgetData.monthlyBudget > 0 && budgetData.remaining > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Daily Average</p>
                      <p className="font-semibold">
                        ${budgetData.orderCount > 0 ? (budgetData.totalSpent / budgetData.orderCount).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Days Remaining</p>
                      <p className="font-semibold">
                        {Math.max(0, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary dark:text-gray-400">Daily Budget Left</p>
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        ${(budgetData.remaining / Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Daily Spending Chart */}
          {Object.keys(budgetData.dailySpending).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(budgetData.dailySpending)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .slice(0, 10)
                    .map(([date, amount]) => (
                      <div key={date} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{formatDate(date)}</span>
                        </div>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          {budgetData.monthlyOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetData.monthlyOrders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-primary dark:text-gray-100">
                          {order.restaurantId.shopName}
                        </p>
                        <p className="text-sm text-secondary dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {budgetData.orderCount === 0 && (
            <Card className="p-8 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2 text-gray-500 dark:text-gray-400">No orders this month yet</p>
              <p className="text-secondary dark:text-gray-400">
                Start ordering to track your spending against your budget
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default BudgetTracker;