import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Percent, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import api from '../../services/api';
import toast from 'react-hot-toast';

const OffersCRUD = () => {
  const [offers, setOffers] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    foodItemId: '',
    discountPercent: '',
    validDate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersRes, foodsRes] = await Promise.all([
        api.get('/shop/offers'),
        api.get('/shop/foods')
      ]);
      setOffers(offersRes.data.offers);
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
    
    try {
      if (editingOffer) {
        // Update existing offer
        const response = await api.put(`/shop/offers/${editingOffer._id}`, {
          ...formData,
          isActive: editingOffer.isActive
        });
        setOffers(offers.map(offer => 
          offer._id === editingOffer._id ? response.data.offer : offer
        ));
        toast.success('Offer updated successfully');
      } else {
        // Create new offer
        const response = await api.post('/shop/offers', formData);
        setOffers([...offers, response.data.offer]);
        toast.success('Offer created successfully');
      }
      
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      foodItemId: offer.foodItemId._id,
      discountPercent: offer.discountPercent.toString(),
      validDate: new Date(offer.validDate).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await api.delete(`/shop/offers/${offerId}`);
      setOffers(offers.filter(offer => offer._id !== offerId));
      toast.success('Offer deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offer');
    }
  };

  const toggleOfferStatus = async (offerId, currentStatus) => {
    try {
      const response = await api.put(`/shop/offers/${offerId}`, {
        isActive: !currentStatus
      });
      setOffers(offers.map(offer => 
        offer._id === offerId ? response.data.offer : offer
      ));
      toast.success(`Offer ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update offer status');
    }
  };

  const resetForm = () => {
    setFormData({
      foodItemId: '',
      discountPercent: '',
      validDate: ''
    });
    setEditingOffer(null);
    setShowForm(false);
  };

  // Get tomorrow's date as minimum date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isOfferExpired = (date) => {
    return new Date(date) < new Date();
  };

  const isOfferExpiringSoon = (date) => {
    const offerDate = new Date(date);
    const today = new Date();
    const diffTime = offerDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
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
          <h2 className="text-2xl font-bold text-primary dark:text-gray-100">Offers Management</h2>
          <p className="text-secondary dark:text-gray-400">Create and manage special offers for your food items</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
          disabled={foods.length === 0}
        >
          <Plus className="h-4 w-4" />
          Create Offer
        </Button>
      </div>

      {/* Info Card */}
      {foods.length === 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
            <Percent className="h-4 w-4" />
            <p>You need to add available food items before creating offers.</p>
          </div>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingOffer ? 'Edit Offer' : 'Create New Offer'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Food Item *
                </label>
                <select
                  required
                  value={formData.foodItemId}
                  onChange={(e) => setFormData({ ...formData, foodItemId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select a food item</option>
                  {foods.map(food => (
                    <option key={food._id} value={food._id}>
                      {food.name} (LKR {food.price}) - {food.category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Discount Percentage *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                  placeholder="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Valid Until *
                </label>
                <input
                  type="date"
                  required
                  min={getTomorrowDate()}
                  value={formData.validDate}
                  onChange={(e) => setFormData({ ...formData, validDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button type="submit">
                {editingOffer ? 'Update' : 'Create'} Offer
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

      {/* Offers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {offers.map(offer => (
          <Card key={offer._id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-1">
                  {offer.foodItemId.name}
                </h3>
                <p className="text-sm text-secondary dark:text-gray-400 mb-2">
                  {offer.foodItemId.category.charAt(0).toUpperCase() + offer.foodItemId.category.slice(1)} • 
                  Original Price: LKR {offer.foodItemId.price.toFixed(2)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(offer)}
                  disabled={isOfferExpired(offer.validDate)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(offer._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Discount Info */}
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Percent className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {offer.discountPercent}% OFF
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Discounted Price</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    LKR {(offer.foodItemId.price * (1 - offer.discountPercent / 100)).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Valid Date */}
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                isOfferExpired(offer.validDate)
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : isOfferExpiringSoon(offer.validDate)
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
              }`}>
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Valid until: {new Date(offer.validDate).toLocaleDateString()}
                  {isOfferExpired(offer.validDate) ? ' (Expired)' : 
                   isOfferExpiringSoon(offer.validDate) ? ' (Expiring Soon)' : ''}
                </span>
              </div>
              
              {/* Status Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Status: {offer.isActive ? 'Active' : 'Inactive'}
                </span>
                <Button
                  size="sm"
                  variant={offer.isActive ? "outline" : "default"}
                  onClick={() => toggleOfferStatus(offer._id, offer.isActive)}
                  disabled={isOfferExpired(offer.validDate)}
                >
                  {offer.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {offers.length === 0 && (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No offers created yet</p>
                <p>Create your first offer to attract more customers</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersCRUD;