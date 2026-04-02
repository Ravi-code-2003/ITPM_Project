import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { roomService } from '../../services/accommodationService';
import RoomMapPicker from './RoomMapPicker';
import toast from 'react-hot-toast';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

const getTodayDateString = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().split('T')[0];
};

const toDateOnly = (dateStr) => {
  const date = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const hasAtLeastOneFacility = (facilities) => Object.values(facilities || {}).some(Boolean);

const isAllowedImageFile = (file) => {
  const mime = (file.type || '').toLowerCase();
  if (ALLOWED_IMAGE_TYPES.includes(mime)) {
    return true;
  }

  const extension = (file.name || '').split('.').pop()?.toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.includes(extension);
};

const RoomFormModal = ({ room, onClose, onSaved }) => {
  const modalRef = useRef(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    monthlyRent: '',
    area: '',
    address: '',
    roomType: 'single',
    gender: 'any',
    availability: 'AVAILABLE',
    availableFrom: getTodayDateString(),
    availableTo: '',
    rules: '',
    facilities: {
      wifi: false,
      water: false,
      electricity: false,
      parking: false,
      attachedBathroom: false,
      airConditioning: false,
      furnished: false,
      kitchen: false,
    },
    latitude: 6.9271, // Default: Colombo, Sri Lanka
    longitude: 79.8612,
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [facilityWarning, setFacilityWarning] = useState('');

  useEffect(() => {
    if (room) {
      const normalizedRoomType = ['single', 'double', 'shared'].includes(room.roomType)
        ? room.roomType
        : 'single';

      setFormData({
        title: room.title || '',
        description: room.description || '',
        monthlyRent: room.monthlyRent || '',
        area: room.location?.area || '',
        address: room.location?.address || '',
        roomType: normalizedRoomType,
        gender: room.gender || 'any',
        availability: room.availability || 'AVAILABLE',
        availableFrom: room.availableFrom ? new Date(room.availableFrom).toISOString().split('T')[0] : getTodayDateString(),
        availableTo: room.availableTo ? new Date(room.availableTo).toISOString().split('T')[0] : '',
        rules: room.rules || '',
        facilities: room.facilities || {
          wifi: false,
          water: false,
          electricity: false,
          parking: false,
          attachedBathroom: false,
          airConditioning: false,
          furnished: false,
          kitchen: false,
        },
        latitude: room.location?.coordinates?.coordinates[1] || 6.9271,
        longitude: room.location?.coordinates?.coordinates[0] || 79.8612,
      });
      setExistingImages(room.images || []);
      setLocationSelected(Boolean(room.location?.coordinates?.coordinates?.length === 2));
    } else {
      setLocationSelected(false);
      setFormData((prev) => ({
        ...prev,
        availableFrom: getTodayDateString(),
      }));
    }
  }, [room]);

  // Scroll modal to top when opened
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFacilityChange = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facility]: !prev.facilities[facility], // Toggle boolean value
      },
    }));

    setFacilityWarning('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + images.length + files.length;

    if (files.length === 0) {
      return;
    }

    const invalidFile = files.find((file) => !isAllowedImageFile(file));
    if (invalidFile) {
      toast.error('Only jpg, jpeg, png, and webp images are allowed');
      return;
    }

    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages((prev) => [...prev, ...files]);
    setFieldErrors((prev) => ({ ...prev, images: '' }));
  };

  const handleRemoveNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => ({ ...prev, images: '' }));
  };

  const handleRemoveExistingImage = async (imageUrl) => {
    if (!room || !window.confirm('Remove this image?')) return;

    try {
      await roomService.deleteRoomImage(room._id, imageUrl);
      setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
      setFieldErrors((prev) => ({ ...prev, images: '' }));
      toast.success('Image removed');
    } catch (error) {
      toast.error('Failed to remove image');
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setLocationSelected(true);
    setFieldErrors((prev) => ({ ...prev, location: '' }));
    setShowMap(false);
  };

  const validateForm = () => {
    const errors = {};
    const sanitized = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      monthlyRent: String(formData.monthlyRent).trim(),
      area: formData.area.trim(),
      address: formData.address.trim(),
      roomType: formData.roomType,
      gender: formData.gender,
      availability: formData.availability,
      availableFrom: formData.availableFrom,
      availableTo: formData.availableTo,
      rules: formData.rules.trim(),
      latitude: formData.latitude,
      longitude: formData.longitude,
      facilities: { ...formData.facilities },
    };

    if (!sanitized.title) {
      errors.title = 'Room Title is required.';
    } else if (sanitized.title.length < 10 || sanitized.title.length > 1000) {
      errors.title = 'Room Title must be between 10 and 1000 characters.';
    } else if (!/[A-Za-z]/.test(sanitized.title)) {
      errors.title = 'Room Title must contain at least one alphabet letter.';
    }

    const monthlyRentNumber = Number(sanitized.monthlyRent);
    if (!sanitized.monthlyRent) {
      errors.monthlyRent = 'Monthly Rent is required.';
    } else if (Number.isNaN(monthlyRentNumber)) {
      errors.monthlyRent = 'Monthly Rent must be a valid number.';
    } else if (monthlyRentNumber <= 0) {
      errors.monthlyRent = 'Monthly Rent must be greater than 0.';
    } else if (monthlyRentNumber < 1000 || monthlyRentNumber > 5000000) {
      errors.monthlyRent = 'Monthly Rent must be between 1000 and 5000000.';
    }

    if (!sanitized.description) {
      errors.description = 'Description is required.';
    } else if (sanitized.description.length < 20 || sanitized.description.length > 10000) {
      errors.description = 'Description must be between 20 and 10000 characters.';
    }

    if (!sanitized.area) {
      errors.area = 'Area is required.';
    } else if (!/^[A-Za-z\s]+$/.test(sanitized.area)) {
      errors.area = 'Area can contain only letters and spaces.';
    }

    if (!sanitized.address) {
      errors.address = 'Address is required.';
    } else if (sanitized.address.length < 10 || sanitized.address.length > 2000) {
      errors.address = 'Address must be between 10 and 2000 characters.';
    }

    if (!locationSelected) {
      errors.location = 'Please select the location from the map.';
    }

    if (!['single', 'double', 'shared'].includes(sanitized.roomType)) {
      errors.roomType = 'Room Type must be Single, Double, or Shared.';
    }

    if (!['male', 'female', 'any'].includes(sanitized.gender)) {
      errors.gender = 'Gender Preference must be Male, Female, or Any.';
    }

    if (!['AVAILABLE', 'NOT_AVAILABLE'].includes(sanitized.availability)) {
      errors.availability = 'Availability must be Available or Not Available.';
    }

    if (!sanitized.availableFrom) {
      errors.availableFrom = 'Available From date is required.';
    } else {
      const availableFromDate = toDateOnly(sanitized.availableFrom);
      const todayDate = toDateOnly(getTodayDateString());
      if (!availableFromDate) {
        errors.availableFrom = 'Available From date is invalid.';
      } else if (availableFromDate < todayDate) {
        errors.availableFrom = 'Available From must be today or a future date.';
      }
    }

    if (sanitized.availableTo) {
      const availableFromDate = toDateOnly(sanitized.availableFrom);
      const availableToDate = toDateOnly(sanitized.availableTo);
      if (!availableToDate) {
        errors.availableTo = 'Available Until date is invalid.';
      } else if (availableFromDate && availableToDate <= availableFromDate) {
        errors.availableTo = 'Available Until must be greater than Available From.';
      }
    }

    if (sanitized.rules) {
      if (sanitized.rules.length > 3000) {
        errors.rules = 'House Rules cannot exceed 3000 characters.';
      } else if (!/[A-Za-z0-9]/.test(sanitized.rules)) {
        errors.rules = 'House Rules cannot contain only symbols or spaces.';
      }
    }

    const totalImages = existingImages.length + images.length;
    if (totalImages < 1) {
      errors.images = 'At least 1 image is required.';
    } else if (totalImages > 5) {
      errors.images = 'Maximum 5 images are allowed.';
    }

    return {
      errors,
      sanitized,
      monthlyRentNumber,
      facilitiesSelected: hasAtLeastOneFacility(sanitized.facilities),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { errors, sanitized, monthlyRentNumber, facilitiesSelected } = validateForm();
    setFieldErrors(errors);

    if (!facilitiesSelected) {
      setFacilityWarning('No facilities selected. You can continue, but adding facilities is recommended.');
      toast('No facilities selected. You can still continue.', { icon: '⚠️' });
    } else {
      setFacilityWarning('');
    }

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the highlighted fields.');
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('title', sanitized.title);
      submitData.append('description', sanitized.description);
      submitData.append('monthlyRent', String(monthlyRentNumber));
      submitData.append('area', sanitized.area);
      submitData.append('address', sanitized.address);
      submitData.append('latitude', String(sanitized.latitude));
      submitData.append('longitude', String(sanitized.longitude));
      submitData.append('roomType', sanitized.roomType);
      submitData.append('gender', sanitized.gender);
      submitData.append('availability', sanitized.availability);
      submitData.append('availableFrom', sanitized.availableFrom);
      submitData.append('locationSelected', 'true');

      if (sanitized.availableTo) {
        submitData.append('availableTo', sanitized.availableTo);
      }
      submitData.append('rules', sanitized.rules);
      
      // Ensure facilities are boolean values, not strings
      const cleanedFacilities = {};
      Object.keys(sanitized.facilities).forEach((key) => {
        cleanedFacilities[key] = Boolean(sanitized.facilities[key]);
      });
      submitData.append('facilities', JSON.stringify(cleanedFacilities));

      // Append new images
      images.forEach((image) => {
        submitData.append('images', image);
      });

      if (room) {
        await roomService.updateRoom(room._id, submitData);
        toast.success('Room updated successfully');
      } else {
        await roomService.createRoom(submitData);
        toast.success('Room created successfully');
      }

      onSaved();
    } catch (error) {
      console.error('Room creation error:', error.response?.data);
      const errorMsg = error.response?.data?.details || error.response?.data?.message || 'Failed to save room';
      toast.error(errorMsg);
      // Scroll to top if validation error
      if (modalRef.current && error.response?.status === 400) {
        modalRef.current.scrollTop = 0;
      }
    } finally {
      setLoading(false);
    }
  };

  const getFieldClasses = (fieldName) => {
    const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:ring-2 dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100';
    const validClasses = 'border-secondary/30 focus:ring-primary';
    const invalidClasses = 'border-red-500 focus:ring-red-500';

    return `${baseClasses} ${fieldErrors[fieldName] ? invalidClasses : validClasses}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8" ref={modalRef}>
        <Card>
          <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100">
              {room ? 'Edit Room' : 'Add New Room'}
            </h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Help Notice */}
          <div className="mb-4 p-3 bg-accent/20 border border-accent/30 rounded-lg">
            <p className="text-sm text-primary dark:text-gray-300">
              <strong>📝 Complete all sections:</strong> Scroll through the form to fill in Basic Information, Location, Room Details, Facilities, and upload Images (required).
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Room Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className={getFieldClasses('title')}
                    placeholder="e.g., Cozy Single Room near University"
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Monthly Rent (Rs.) *
                  </label>
                  <input
                    type="number"
                    name="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={handleChange}
                    required
                    min="1000"
                    max="5000000"
                    className={getFieldClasses('monthlyRent')}
                    placeholder="15000"
                  />
                  {fieldErrors.monthlyRent && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.monthlyRent}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="3"
                  className={getFieldClasses('description')}
                  placeholder="Describe your room..."
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.description}</p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Area *
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                    className={getFieldClasses('area')}
                    placeholder="e.g., Malabe"
                  />
                  {fieldErrors.area && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.area}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className={getFieldClasses('address')}
                    placeholder="Full address"
                  />
                  {fieldErrors.address && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.address}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(true)}
                  icon={<MapPin className="h-4 w-4" />}
                  className={fieldErrors.location ? 'border-red-500 text-red-600' : ''}
                >
                  {formData.latitude && formData.longitude
                    ? 'Update Location on Map'
                    : 'Set Location on Map'}
                </Button>
                {fieldErrors.location && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.location}</p>
                )}
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-secondary dark:text-gray-400 mt-2">
                    Location: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            {/* Room Details */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">
                Room Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Room Type *
                  </label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    className={getFieldClasses('roomType')}
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="shared">Shared</option>
                  </select>
                  {fieldErrors.roomType && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.roomType}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Gender Preference *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={getFieldClasses('gender')}
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  {fieldErrors.gender && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.gender}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Availability *
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className={getFieldClasses('availability')}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
                  {fieldErrors.availability && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.availability}</p>
                  )}
                </div>
              </div>

              {/* Availability Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Available From *
                  </label>
                  <input
                    type="date"
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleChange}
                    required
                    min={getTodayDateString()}
                    className={getFieldClasses('availableFrom')}
                  />
                  {fieldErrors.availableFrom && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.availableFrom}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Available Until (Optional)
                  </label>
                  <input
                    type="date"
                    name="availableTo"
                    value={formData.availableTo}
                    onChange={handleChange}
                    min={formData.availableFrom}
                    className={getFieldClasses('availableTo')}
                  />
                  {fieldErrors.availableTo && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.availableTo}</p>
                  )}
                  <p className="text-xs text-secondary dark:text-gray-400 mt-1">
                    Leave empty if available indefinitely
                  </p>
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">
                Facilities
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(formData.facilities).map((facility) => (
                  <label
                    key={facility}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.facilities[facility]}
                      onChange={() => handleFacilityChange(facility)}
                      className="rounded border-secondary/30 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-primary dark:text-gray-300 capitalize">
                      {facility.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
              {facilityWarning && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{facilityWarning}</p>
              )}
            </div>

            {/* Rules */}
            <div>
              <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                House Rules (Optional)
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleChange}
                rows="2"
                className={getFieldClasses('rules')}
                placeholder="e.g., No smoking, No pets, Quiet hours after 10 PM"
              />
              {fieldErrors.rules && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.rules}</p>
              )}
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-4">
                Images (Max 5)
              </h3>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                        alt={`Room ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(img)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Images */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`New ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {existingImages.length + images.length < 5 && (
                <div>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-secondary/30 rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <Upload className="h-8 w-8 text-secondary dark:text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-secondary dark:text-gray-400">
                        Click to upload images
                      </p>
                      <p className="text-xs text-secondary/60 dark:text-gray-500 mt-1">
                        {5 - (existingImages.length + images.length)} remaining
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {fieldErrors.images && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{fieldErrors.images}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
      </div>

      {/* Map Picker Modal */}
      {showMap && (
        <RoomMapPicker
          initialLat={formData.latitude}
          initialLng={formData.longitude}
          onSelect={handleLocationSelect}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  );
};

export default RoomFormModal;
