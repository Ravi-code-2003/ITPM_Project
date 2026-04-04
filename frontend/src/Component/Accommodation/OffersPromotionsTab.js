import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Gift, Calendar, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react';
import * as yup from 'yup';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { roomOfferService, roomService } from '../../services/accommodationService';
import toast from 'react-hot-toast';

const getTodayIsoDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

const startOfDay = (dateInput) => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const trimFormText = (data) => ({
  ...data,
  title: (data.title || '').trim(),
  description: (data.description || '').trim(),
});

const createOfferValidationSchema = (roomIds = []) =>
  yup.object({
    roomId: yup
      .string()
      .required('Select Room is required')
      .oneOf(roomIds, 'Please select a valid room option'),
    title: yup
      .string()
      .transform((value) => (value || '').trim())
      .required('Offer Title is required')
      .min(5, 'Offer Title must be at least 5 characters')
      .max(100, 'Offer Title cannot exceed 100 characters')
      .test('has-letter', 'Offer Title must contain at least one letter', (value) => /[A-Za-z]/.test(value || '')),
    description: yup
      .string()
      .transform((value) => (value || '').trim())
      .test('description-length', 'Description must be at least 10 characters when provided', (value) => {
        if (!value) return true;
        return value.length >= 10;
      })
      .max(500, 'Description cannot exceed 500 characters'),
    discountType: yup
      .string()
      .required('Discount Type is required')
      .oneOf(['none', 'percentage', 'fixed'], 'Discount Type must be No Discount, Percentage, or Fixed Amount'),
    discountAmount: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null || originalValue === undefined ? null : value))
      .nullable()
      .when('discountType', {
        is: 'fixed',
        then: (schema) =>
          schema
            .typeError('Discount Value must be a number')
            .required('Discount Value is required for Fixed Amount')
            .moreThan(0, 'Discount Value must be greater than 0')
            .max(500000, 'Discount Value cannot exceed 500000'),
        otherwise: (schema) => schema.nullable().notRequired(),
      }),
    discountPercent: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null || originalValue === undefined ? null : value))
      .nullable()
      .when('discountType', {
        is: 'percentage',
        then: (schema) =>
          schema
            .typeError('Discount Value must be a number')
            .required('Discount Value is required for Percentage')
            .min(1, 'Discount Value must be at least 1')
            .max(100, 'Discount Value cannot exceed 100'),
        otherwise: (schema) => schema.nullable().notRequired(),
      }),
    validFrom: yup
      .string()
      .required('Valid From is required')
      .test('valid-from-date', 'Valid From must be a valid date', (value) => Boolean(startOfDay(value)))
      .test('valid-from-not-past', 'Valid From must be today or a future date', (value) => {
        const selected = startOfDay(value);
        const today = startOfDay(new Date());
        if (!selected || !today) return false;
        return selected >= today;
      }),
    validTo: yup
      .string()
      .required('Valid To is required')
      .test('valid-to-date', 'Valid To must be a valid date', (value) => Boolean(startOfDay(value)))
      .test('valid-to-after-from', 'Valid To must be after Valid From', function validateValidTo(value) {
        const from = startOfDay(this.parent.validFrom);
        const to = startOfDay(value);
        if (!from || !to) return false;
        return to > from;
      }),
  });

const OffersPromotionsTab = ({ onUpdate }) => {
  const initialFormData = {
    roomId: '',
    title: '',
    description: '',
    discountType: 'none',
    discountAmount: '',
    discountPercent: '',
    validFrom: getTodayIsoDate(),
    validTo: '',
  };

  const [offers, setOffers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [fieldErrors, setFieldErrors] = useState({});

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
    setFormData(initialFormData);
    setFieldErrors({});
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
    setFieldErrors({});
    setShowForm(true);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleDiscountTypeChange = (discountType) => {
    setFormData((prev) => ({
      ...prev,
      discountType,
      discountAmount: discountType === 'fixed' ? prev.discountAmount : '',
      discountPercent: discountType === 'percentage' ? prev.discountPercent : '',
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.discountType;
      delete next.discountAmount;
      delete next.discountPercent;
      return next;
    });
  };

  const getInputClassName = (fieldName) => {
    const baseClass = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100';
    return fieldErrors[fieldName]
      ? `${baseClass} border-red-500 focus:ring-red-500`
      : `${baseClass} border-secondary/30`;
  };

  const hasOverlappingActiveOffer = ({ roomId, validFrom, validTo, excludedOfferId = null }) => {
    const newStart = startOfDay(validFrom);
    const newEnd = startOfDay(validTo);

    if (!newStart || !newEnd) return false;

    return offers.some((offer) => {
      if (!offer?.isActive) return false;
      if (excludedOfferId && offer._id === excludedOfferId) return false;
      if ((offer.room?._id || '') !== roomId) return false;

      const offerStart = startOfDay(offer.validFrom);
      const offerEnd = startOfDay(offer.validTo);
      if (!offerStart || !offerEnd) return false;

      return offerStart <= newEnd && offerEnd >= newStart;
    });
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

    if (formData.description && formData.description.length > 0 && formData.description.trim().length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        description: 'Description cannot contain only spaces',
      }));
      toast.error('Please fix the highlighted fields');
      return;
    }

    const sanitizedData = trimFormText(formData);
    setFormData(sanitizedData);

    try {
      const schema = createOfferValidationSchema(rooms.map((room) => room._id));
      await schema.validate(sanitizedData, { abortEarly: false });
      setFieldErrors({});
    } catch (validationError) {
      if (validationError.name === 'ValidationError') {
        const nextErrors = {};
        validationError.inner.forEach((err) => {
          if (err.path && !nextErrors[err.path]) {
            nextErrors[err.path] = err.message;
          }
        });
        setFieldErrors(nextErrors);
        toast.error('Please fix the highlighted fields');
        return;
      }
    }

    const overlapDetected = hasOverlappingActiveOffer({
      roomId: sanitizedData.roomId,
      validFrom: sanitizedData.validFrom,
      validTo: sanitizedData.validTo,
      excludedOfferId: editingOffer?._id || null,
    });

    if (overlapDetected) {
      setFieldErrors((prev) => ({
        ...prev,
        validFrom: 'An active offer already overlaps with this date range for the selected room',
        validTo: 'Choose a non-overlapping date range',
      }));
      toast.error('Overlapping active offers are not allowed for the same room');
      return;
    }

    try {
      const submitData = {
        title: sanitizedData.title,
        description: sanitizedData.description,
        discountType: sanitizedData.discountType,
        discountAmount: sanitizedData.discountType === 'fixed' ? Number(sanitizedData.discountAmount) : 0,
        discountPercent: sanitizedData.discountType === 'percentage' ? Number(sanitizedData.discountPercent) : 0,
        validFrom: sanitizedData.validFrom,
        validTo: sanitizedData.validTo,
      };

      if (editingOffer) {
        await roomOfferService.updateOffer(editingOffer._id, submitData);
        toast.success('Offer updated successfully');
      } else {
        await roomOfferService.createOffer(sanitizedData.roomId, submitData);
        toast.success('Offer created successfully');
      }

      setShowForm(false);
      setEditingOffer(null);
      setFormData(initialFormData);
      setFieldErrors({});
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
                    onChange={(e) => handleInputChange('roomId', e.target.value)}
                    required
                    className={getInputClassName('roomId')}
                  >
                    <option value="">Choose a room</option>
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.title} - Rs. {room.monthlyRent?.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.roomId && <p className="mt-1 text-xs text-red-600">{fieldErrors.roomId}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  className={getInputClassName('title')}
                  placeholder="e.g., Rs. 2000 off first month"
                />
                {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows="2"
                  className={getInputClassName('description')}
                  placeholder="Offer details..."
                />
                {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => handleDiscountTypeChange(e.target.value)}
                    className={getInputClassName('discountType')}
                  >
                    <option value="none">No Discount</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                  {fieldErrors.discountType && <p className="mt-1 text-xs text-red-600">{fieldErrors.discountType}</p>}
                </div>

                {formData.discountType === 'fixed' && (
                  <div>
                    <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                      Discount Value (Rs.) *
                    </label>
                    <input
                      type="number"
                      value={formData.discountAmount}
                      onChange={(e) => handleInputChange('discountAmount', e.target.value)}
                      min="1"
                      className={getInputClassName('discountAmount')}
                      placeholder="2000"
                    />
                    {fieldErrors.discountAmount && <p className="mt-1 text-xs text-red-600">{fieldErrors.discountAmount}</p>}
                  </div>
                )}

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                      Discount Value (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => handleInputChange('discountPercent', e.target.value)}
                      min="1"
                      max="100"
                      className={getInputClassName('discountPercent')}
                      placeholder="10"
                    />
                    {fieldErrors.discountPercent && <p className="mt-1 text-xs text-red-600">{fieldErrors.discountPercent}</p>}
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
                    onChange={(e) => handleInputChange('validFrom', e.target.value)}
                    required
                    className={getInputClassName('validFrom')}
                  />
                  {fieldErrors.validFrom && <p className="mt-1 text-xs text-red-600">{fieldErrors.validFrom}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Valid To *
                  </label>
                  <input
                    type="date"
                    value={formData.validTo}
                    onChange={(e) => handleInputChange('validTo', e.target.value)}
                    required
                    min={formData.validFrom}
                    className={getInputClassName('validTo')}
                  />
                  {fieldErrors.validTo && <p className="mt-1 text-xs text-red-600">{fieldErrors.validTo}</p>}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOffer(null);
                    setFieldErrors({});
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
