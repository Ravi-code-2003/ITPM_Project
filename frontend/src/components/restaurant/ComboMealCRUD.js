import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Package, CheckCircle, XCircle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ComboMealCRUD = () => {
  const [combos, setCombos] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    items: [],
    totalPrice: '',
    status: 'Available'
  });

  const statuses = ['Available', 'OutOfStock'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [combosRes, foodsRes] = await Promise.all([
        api.get('/shop/combos'),
        api.get('/shop/foods')
      ]);
      setCombos(combosRes.data.combos);
      setFoods(foodsRes.data.foods.filter(food => food.status === 'Available'));
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length < 2) {
      toast.error('Combo meal must have at least 2 items');
      return;
    }
    
    try {
      if (editingCombo) {
        // Update existing combo
        const response = await api.put(`/shop/combos/${editingCombo._id}`, formData);
        setCombos(combos.map(combo => 
          combo._id === editingCombo._id ? response.data.combo : combo
        ));
        toast.success('Combo meal updated successfully');
      } else {
        // Create new combo
        const response = await api.post('/shop/combos', formData);
        setCombos([...combos, response.data.combo]);
        toast.success('Combo meal created successfully');
      }
      
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (combo) => {
    setEditingCombo(combo);
    setFormData({
      name: combo.name,
      items: combo.items.map(item => item._id),
      totalPrice: combo.totalPrice.toString(),
      status: combo.status
    });
    setShowForm(true);
  };

  const handleDelete = async (comboId) => {
    if (!window.confirm('Are you sure you want to delete this combo meal?')) {
      return;
    }

    try {
      await api.delete(`/shop/combos/${comboId}`);
      setCombos(combos.filter(combo => combo._id !== comboId));
      toast.success('Combo meal deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete combo meal');
    }
  };

  const handleItemToggle = (foodId) => {
    const currentItems = formData.items;
    if (currentItems.includes(foodId)) {
      setFormData({
        ...formData,
        items: currentItems.filter(id => id !== foodId)
      });
    } else {
      setFormData({
        ...formData,
        items: [...currentItems, foodId]
      });
    }
  };

  const calculateSuggestedPrice = () => {
    if (formData.items.length === 0) return 0;
    
    const totalIndividualPrice = formData.items.reduce((sum, itemId) => {
      const food = foods.find(f => f._id === itemId);
      return sum + (food ? food.price : 0);
    }, 0);
    
    // Suggest 10-15% discount from individual prices
    return (totalIndividualPrice * 0.85).toFixed(2);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      items: [],
      totalPrice: '',
      status: 'Available'
    });
    setEditingCombo(null);
    setShowForm(false);
  };

  const getSelectedItems = () => {
    return formData.items.map(itemId => 
      foods.find(food => food._id === itemId)
    ).filter(Boolean);
  };

  const groupedFoods = foods.reduce((acc, food) => {
    if (!acc[food.category]) {
      acc[food.category] = [];
    }
    acc[food.category].push(food);
    return acc;
  }, {});

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
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Combo Meals Management</h2>
          <p className="text-secondary dark:text-gray-400">Create combo meals to increase average order value</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
          disabled={foods.length < 2}
        >
          <Plus className="h-4 w-4" />
          Create Combo
        </Button>
      </div>

      {/* Info Card */}
      {foods.length < 2 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <Package className="h-4 w-4" />
            <p>You need at least 2 available food items to create combo meals.</p>
          </div>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCombo ? 'Edit Combo Meal' : 'Create New Combo Meal'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Combo Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., Student Special Combo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Price ($) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                    placeholder="0.00"
                  />
                  {formData.items.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs"
                      onClick={() => setFormData({ ...formData, totalPrice: calculateSuggestedPrice() })}
                    >
                      Suggest: ${calculateSuggestedPrice()}
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Items Summary */}
            {formData.items.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Selected Items ({formData.items.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getSelectedItems().map(item => (
                    <span 
                      key={item._id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-sm rounded-md"
                    >
                      {item.name} (${item.price})
                      <button
                        type="button"
                        onClick={() => handleItemToggle(item._id)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-700 rounded-full p-0.5"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-2">
                  Individual total: ${getSelectedItems().reduce((sum, item) => sum + item.price, 0).toFixed(2)} • 
                  Your price: ${formData.totalPrice || '0.00'} • 
                  Savings: ${Math.max(0, getSelectedItems().reduce((sum, item) => sum + item.price, 0) - parseFloat(formData.totalPrice || 0)).toFixed(2)}
                </p>
              </div>
            )}
            
            {/* Food Items Selection */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Food Items * (minimum 2 required)
              </h4>
              <div className="space-y-4">
                {Object.entries(groupedFoods).map(([category, categoryFoods]) => (
                  <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h5 className="font-medium text-gray-600 dark:text-gray-400 mb-3 capitalize">
                      {category}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categoryFoods.map(food => (
                        <div
                          key={food._id}
                          onClick={() => handleItemToggle(food._id)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            formData.items.includes(food._id)
                              ? 'border-primary bg-primary/10 dark:bg-primary/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                {food.name}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-400">
                                ${food.price.toFixed(2)}
                              </p>
                            </div>
                            {formData.items.includes(food._id) ? (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button type="submit" disabled={formData.items.length < 2}>
                {editingCombo ? 'Update' : 'Create'} Combo Meal
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Combos List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {combos.map(combo => (
          <Card key={combo._id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100">
                  {combo.name}
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${combo.totalPrice.toFixed(2)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(combo)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(combo._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  combo.status === 'Available'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {combo.status}
                </span>
              </div>
              
              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Includes ({combo.items.length} items):
                </h4>
                <div className="space-y-1">
                  {combo.items.map(item => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                      <span className="text-gray-500 dark:text-gray-500">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                {/* Savings */}
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-600 dark:text-gray-400">Individual total:</span>
                    <span className="line-through text-gray-500 dark:text-gray-500">
                      ${combo.items.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-green-600 dark:text-green-400">
                    <span>You save:</span>
                    <span>
                      ${Math.max(0, combo.items.reduce((sum, item) => sum + item.price, 0) - combo.totalPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {combos.length === 0 && (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No combo meals created yet</p>
                <p>Create combo meals to encourage larger orders and increase revenue</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComboMealCRUD;