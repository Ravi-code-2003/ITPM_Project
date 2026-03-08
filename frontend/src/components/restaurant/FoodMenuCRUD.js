import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FoodMenuCRUD = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'breakfast',
    status: 'Available'
  });

  const categories = ['breakfast', 'lunch', 'dinner', 'snack', 'drink'];
  const statuses = ['Available', 'OutOfStock'];

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shop/foods');
      setFoods(response.data.foods);
    } catch (error) {
      toast.error('Failed to fetch food items');
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingFood) {
        // Update existing food
        const response = await api.put(`/shop/foods/${editingFood._id}`, formData);
        setFoods(foods.map(food => 
          food._id === editingFood._id ? response.data.food : food
        ));
        toast.success('Food item updated successfully');
      } else {
        // Create new food
        const response = await api.post('/shop/foods', formData);
        setFoods([...foods, response.data.food]);
        toast.success('Food item created successfully');
      }
      
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      price: food.price.toString(),
      category: food.category,
      status: food.status
    });
    setShowForm(true);
  };

  const handleDelete = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this food item? This will also remove related offers and combos.')) {
      return;
    }

    try {
      await api.delete(`/shop/foods/${foodId}`);
      setFoods(foods.filter(food => food._id !== foodId));
      toast.success('Food item deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete food item');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'breakfast',
      status: 'Available'
    });
    setEditingFood(null);
    setShowForm(false);
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
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Menu Management</h2>
          <p className="text-secondary dark:text-gray-400">Manage your food items and menu</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Food Item
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  placeholder="Enter food name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price (LKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
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
            
            <div className="flex gap-3">
              <Button type="submit">
                {editingFood ? 'Update' : 'Create'} Food Item
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

      {/* Food Items by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryFoods = groupedFoods[category] || [];
          if (categoryFoods.length === 0) return null;
          
          return (
            <Card key={category} className="p-6">
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {category} ({categoryFoods.length} items)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryFoods.map(food => (
                  <div 
                    key={food._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-primary dark:text-gray-100">
                        {food.name}
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(food)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(food._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                      LKR {food.price.toFixed(2)}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {food.status === 'Available' ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm ${
                        food.status === 'Available' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {food.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        
        {Object.keys(groupedFoods).length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No food items yet</p>
              <p>Start building your menu by adding your first food item</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FoodMenuCRUD;