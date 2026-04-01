import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { roomService } from '../../services/accommodationService';
import RoomMapPicker from './RoomMapPicker';
import toast from 'react-hot-toast';

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
    availableFrom: new Date().toISOString().split('T')[0],
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

  useEffect(() => {
    if (room) {
      setFormData({
        title: room.title || '',
        description: room.description || '',
        monthlyRent: room.monthlyRent || '',
        area: room.location?.area || '',
        address: room.location?.address || '',
        roomType: room.roomType || 'single',
        gender: room.gender || 'any',
        availability: room.availability || 'AVAILABLE',
        availableFrom: room.availableFrom ? new Date(room.availableFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
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
  };

  const handleFacilityChange = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: {
        ...prev.facilities,
        [facility]: !prev.facilities[facility], // Toggle boolean value
      },
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + images.length + files.length;

    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setImages((prev) => [...prev, ...files]);
  };

  const handleRemoveNewImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = async (imageUrl) => {
    if (!room || !window.confirm('Remove this image?')) return;

    try {
      await roomService.deleteRoomImage(room._id, imageUrl);
      setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
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
    setShowMap(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields before submitting
    const requiredFields = [
      { name: 'title', label: 'Room Title', value: formData.title },
      { name: 'description', label: 'Description', value: formData.description },
      { name: 'monthlyRent', label: 'Monthly Rent', value: formData.monthlyRent },
      { name: 'area', label: 'Area', value: formData.area },
      { name: 'address', label: 'Address', value: formData.address },
    ];

    const missingFields = requiredFields.filter(field => !field.value || field.value.toString().trim() === '');
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      // Scroll modal to top to show missing fields
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
      return;
    }

    // Validate description length
    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
      return;
    }

    // Validate title length
    if (formData.title.trim().length < 5) {
      toast.error('Room Title must be at least 5 characters');
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
      return;
    }

    setLoading(true);

    try {
      // Log facilities before stringifying
      console.log('Facilities before stringify:', formData.facilities);
      console.log('Facilities type:', typeof formData.facilities);
      
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('monthlyRent', formData.monthlyRent);
      submitData.append('area', formData.area);
      submitData.append('address', formData.address);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('roomType', formData.roomType);
      submitData.append('gender', formData.gender);
      submitData.append('availability', formData.availability);
      submitData.append('availableFrom', formData.availableFrom);
      if (formData.availableTo) {
        submitData.append('availableTo', formData.availableTo);
      }
      submitData.append('rules', formData.rules);
      
      // Ensure facilities are boolean values, not strings
      const cleanedFacilities = {};
      Object.keys(formData.facilities).forEach(key => {
        cleanedFacilities[key] = Boolean(formData.facilities[key]);
      });
      
      const facilitiesString = JSON.stringify(cleanedFacilities);
      console.log('Facilities stringified:', facilitiesString);
      submitData.append('facilities', facilitiesString);

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
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g., Cozy Single Room near University"
                  />
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
                    min="0"
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                    placeholder="15000"
                  />
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
                  className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  placeholder="Describe your room..."
                />
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
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                    placeholder="e.g., Malabe, Nugegoda"
                  />
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
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                    placeholder="Full address"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(true)}
                  icon={<MapPin className="h-4 w-4" />}
                >
                  {formData.latitude && formData.longitude
                    ? 'Update Location on Map'
                    : 'Set Location on Map'}
                </Button>
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
                    Room Type
                  </label>
                  <select
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="studio">Studio</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Gender Preference
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Availability
                  </label>
                  <select
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="NOT_AVAILABLE">Not Available</option>
                  </select>
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
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
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
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
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
                className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                placeholder="e.g., No smoking, No pets, Quiet hours after 10 PM"
              />
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
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
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
