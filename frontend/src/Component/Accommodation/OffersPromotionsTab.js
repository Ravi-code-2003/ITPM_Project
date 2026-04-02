import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Gift, Calendar, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomOfferService, roomService } from '../../services/accommodationService';
import toast from 'react-hot-toast';

const OffersPromotionsTab = ({ onUpdate }) => {
  const [offers, setOffers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    roomId: '',
    title: '',
    description: '',
    discountType: 'none',
    discountAmount: '',
    discountPercent: '',
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [offersResponse, roomsResponse] = await Promise.all([
        roomOfferService.getMyOffers(),
        roomService.getMyRooms(),
      ]);
      setOffers(offersResponse.data || []);
      setRooms(roomsResponse.data || []);
      onUpdate && onUpdate();
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffer = () => {
    setEditingOffer(null);
    setFormData({
      roomId: '',
      title: '',
      description: '',
      discountType: 'none',
      discountAmount: '',
      discountPercent: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
    });
    setShowForm(true);
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setFormData({
      roomId: offer.room?._id || '',
      title: offer.title || '',
      description: offer.description || '',
      discountType: offer.discountType || 'none',
      discountAmount: offer.discountAmount || '',
      discountPercent: offer.discountPercent || '',
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
      validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;

    try {
      await roomOfferService.deleteOffer(offerId);
      toast.success('Offer deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offer');
    }
  };

  const handleToggleStatus = async (offerId) => {
    try {
      await roomOfferService.toggleOfferStatus(offerId);
      toast.success('Offer status updated');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update offer');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        discountType: formData.discountType,
        discountAmount: parseFloat(formData.discountAmount) || 0,
        discountPercent: parseFloat(formData.discountPercent) || 0,
        validFrom: formData.validFrom,
        validTo: formData.validTo,
      };

      if (editingOffer) {
        await roomOfferService.updateOffer(editingOffer._id, submitData);
        toast.success('Offer updated successfully');
      } else {
        await roomOfferService.createOffer(formData.roomId, submitData);
        toast.success('Offer created successfully');
      }

      setShowForm(false);
      setEditingOffer(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save offer');
    }
  };

  const isOfferActive = (offer) => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validTo = new Date(offer.validTo);
    return offer.isActive && now >= validFrom && now <= validTo;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary dark:text-gray-100">
            Offers & Promotions
          </h2>
          <p className="text-sm text-secondary dark:text-gray-400 mt-1">
            Create limited-time offers to attract more tenants
          </p>
        </div>
        <Button onClick={handleAddOffer} icon={<Plus className="h-4 w-4" />}>
          Add New Offer
        </Button>
      </div>

      {/* Offer Form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingOffer && (
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Select Room *
                  </label>
                  <select
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">Choose a room</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.title} - Rs. {room.monthlyRent?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  placeholder="e.g., Rs. 2000 off first month"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  placeholder="Offer details..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="none">No Discount</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>

                {formData.discountType === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                      Discount Amount (Rs.)
                    </label>
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      min="0"
                      className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                      placeholder="2000"
                    />
                  </div>
                )}

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                      placeholder="10"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Valid To *
                  </label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    required
                    min={formData.validFrom}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOffer(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingOffer ? 'Update Offer' : 'Create Offer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Offers List */}
      {offers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="mx-auto h-12 w-12 text-secondary dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-primary dark:text-gray-100 mb-2">
              No offers created yet
            </h3>
            <p className="text-secondary dark:text-gray-400 mb-6">
              Create promotional offers to attract more students
            </p>
            <Button onClick={handleAddOffer}>Create Your First Offer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => {
            const active = isOfferActive(offer);
            return (
              <Card key={offer._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-primary dark:text-gray-100 mb-1">
                        {offer.title}
                      </h3>
                      <p className="text-sm text-secondary dark:text-gray-400 mb-2">
                        {offer.room?.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {offer.description && (
                    <p className="text-sm text-secondary dark:text-gray-400 mb-4">
                      {offer.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-sm">
                    {offer.discountType !== 'none' && (
                      <div className="flex items-center text-secondary dark:text-gray-400">
                        <DollarSign className="h-4 w-4 mr-2 text-primary dark:text-accent" />
                        {offer.discountType === 'fixed'
                          ? `Rs. ${offer.discountAmount?.toLocaleString()} discount`
                          : `${offer.discountPercent}% discount`}
                      </div>
                    )}
                    <div className="flex items-center text-secondary dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-2 text-primary dark:text-accent" />
                      {new Date(offer.validFrom).toLocaleDateString()} -{' '}
                      {new Date(offer.validTo).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(offer._id)}
                      icon={
                        offer.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )
                      }
                    >
                      {offer.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOffer(offer)}
                      icon={<Edit className="h-4 w-4" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteOffer(offer._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OffersPromotionsTab;
