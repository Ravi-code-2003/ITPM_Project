import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, User, Home, Gift, Phone, MessageSquare } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { roomRequestService, roomService } from '../../services/accommodationService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

const RoomDetailModal = ({ room, onClose }) => {
  const { user } = useAuth();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    message: '',
    phone: '',
    whatsapp: '',
  });
  const [formErrors, setFormErrors] = useState({
    phone: '',
    whatsapp: '',
  });
  const [selectedImage, setSelectedImage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const validateSriLankanNumber = (value, required = false) => {
    const number = value.trim();

    if (!number) {
      return required ? 'Phone number is required' : '';
    }

    if (/^0\d{9}$/.test(number)) {
      return '';
    }

    if (/^\+94[1-9]\d{8}$/.test(number)) {
      return '';
    }

    return 'Use 0XXXXXXXXX (10 digits) or +94XXXXXXXXX (9 digits after +94, not +940...)';
  };

  const handleContactChange = (field, value) => {
    setRequestData((prev) => ({ ...prev, [field]: value }));

    if (field === 'phone') {
      setFormErrors((prev) => ({
        ...prev,
        phone: value ? validateSriLankanNumber(value, true) : '',
      }));
      return;
    }

    if (field === 'whatsapp') {
      setFormErrors((prev) => ({
        ...prev,
        whatsapp: value ? validateSriLankanNumber(value, false) : '',
      }));
    }
  };

  // Increment view count when modal opens
  useEffect(() => {
    if (room && room._id) {
      // Call the room detail endpoint which auto-increments views
      roomService.getRoom(room._id).catch(err => {
        console.error('Failed to increment view count:', err);
      });
    }
  }, [room]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    const phoneError = validateSriLankanNumber(requestData.phone, true);
    const whatsappError = requestData.whatsapp
      ? validateSriLankanNumber(requestData.whatsapp, false)
      : '';

    if (phoneError || whatsappError) {
      setFormErrors({
        phone: phoneError,
        whatsapp: whatsappError,
      });
      return;
    }

    setSubmitting(true);

    try {
      await roomRequestService.createRequest(room._id, requestData);
      toast.success('Request sent successfully!');
      setShowRequestForm(false);
      setRequestData({ message: '', phone: '', whatsapp: '' });
      setFormErrors({ phone: '', whatsapp: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  const facilityList = [
    { key: 'wifi', label: 'WiFi', icon: '📶' },
    { key: 'water', label: 'Water', icon: '💧' },
    { key: 'electricity', label: 'Electricity', icon: '⚡' },
    { key: 'parking', label: 'Parking', icon: '🚗' },
    { key: 'attachedBathroom', label: 'Attached Bathroom', icon: '🚿' },
    { key: 'airConditioning', label: 'Air Conditioning', icon: '❄️' },
    { key: 'furnished', label: 'Furnished', icon: '🛋️' },
    { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl my-4" onClick={(event) => event.stopPropagation()}>
        <Card className="w-full rounded-3xl overflow-hidden shadow-2xl">
          <div className="max-h-[86vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent">
            <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary dark:text-gray-100 mb-2">
                {room.title}
              </h2>
              <div className="flex items-center text-secondary dark:text-gray-400">
                <MapPin className="h-4 w-4 mr-1" />
                {room.location?.area} • {room.location?.address}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Images */}
          {room.images && room.images.length > 0 && (
            <div className="mb-6">
              <div className="relative h-64 sm:h-72 md:h-80 rounded-lg overflow-hidden mb-4">
                <img
                  src={room.images[selectedImage].startsWith('http') ? room.images[selectedImage] : `http://localhost:5000${room.images[selectedImage]}`}
                  alt={room.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {room.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {room.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-16 sm:h-20 rounded-lg overflow-hidden ${
                        selectedImage === index ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                        alt={`${room.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - Details */}
            <div className="md:col-span-2 space-y-6">
              {/* Price & Type */}
              <div>
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-primary dark:text-gray-100">
                    Rs. {room.monthlyRent?.toLocaleString()}
                  </span>
                  <span className="text-secondary dark:text-gray-400">/month</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-accent/20 text-primary dark:text-accent px-3 py-1 rounded-full text-sm font-medium">
                    {room.roomType}
                  </span>
                  <span className="bg-secondary/20 text-primary dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                    {room.gender === 'any' ? 'Any Gender' : room.gender}
                  </span>
                  <span className="bg-primary/10 text-primary dark:text-accent px-3 py-1 rounded-full text-sm font-medium">
                    {room.availability}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">
                  Description
                </h3>
                <p className="text-secondary dark:text-gray-400">{room.description}</p>
              </div>

              {/* Facilities */}
              <div>
                <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-3">
                  Facilities
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {facilityList.map(
                    (facility) =>
                      room.facilities?.[facility.key] && (
                        <div
                          key={facility.key}
                          className="flex items-center text-sm text-primary dark:text-gray-300"
                        >
                          <span className="mr-2 text-lg">{facility.icon}</span>
                          {facility.label}
                        </div>
                      )
                  )}
                </div>
              </div>

              {/* Rules */}
              {room.rules && (
                <div>
                  <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-2">
                    House Rules
                  </h3>
                  <p className="text-secondary dark:text-gray-400">{room.rules}</p>
                </div>
              )}

              {/* Active Offers */}
              {room.activeOffers && room.activeOffers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-3">
                    🎉 Special Offers
                  </h3>
                  <div className="space-y-2">
                    {room.activeOffers.map((offer) => (
                      <div
                        key={offer._id}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Gift className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-800 dark:text-green-300">
                              {offer.title}
                            </h4>
                            {offer.description && (
                              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                {offer.description}
                              </p>
                            )}
                            <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                              Valid until {new Date(offer.validTo).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              {room.location?.coordinates && (
                <div>
                  <h3 className="text-lg font-semibold text-primary dark:text-gray-100 mb-3">
                    Location
                  </h3>
                  <div className="h-56 rounded-lg overflow-hidden border-2 border-secondary/20">
                    <MapContainer
                      center={[
                        room.location.coordinates.coordinates[1],
                        room.location.coordinates.coordinates[0],
                      ]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[
                          room.location.coordinates.coordinates[1],
                          room.location.coordinates.coordinates[0],
                        ]}
                      />
                    </MapContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Owner Info & Request Form */}
            <div className="space-y-4">
              {/* Owner Info */}
              <div className="bg-amber-100/70 dark:bg-background-dark rounded-lg p-4 border border-amber-200 dark:border-gray-700">
                <h3 className="font-semibold text-primary dark:text-gray-100 mb-3">
                  Property Owner
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-secondary dark:text-gray-400">
                    <User className="h-4 w-4 mr-2" />
                    {room.owner?.fullName}
                  </div>
                </div>
              </div>

              {/* Request Button */}
              {user && user.role === 'student' && (
                <div>
                  {!showRequestForm ? (
                    <Button
                      fullWidth
                      onClick={() => setShowRequestForm(true)}
                      icon={<MessageSquare className="h-4 w-4" />}
                    >
                      Send Inquiry
                    </Button>
                  ) : (
                    <div className="bg-amber-100/70 dark:bg-background-dark rounded-lg p-4 border border-amber-200 dark:border-gray-700">
                      <h3 className="font-semibold text-primary dark:text-gray-100 mb-3">
                        Send Inquiry
                      </h3>
                      <form onSubmit={handleSubmitRequest} className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={requestData.phone}
                            onChange={(e) => handleContactChange('phone', e.target.value)}
                            required
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary bg-amber-50 dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100 ${
                              formErrors.phone ? 'border-red-500' : 'border-amber-200'
                            }`}
                            placeholder="0771234567 or +94771234567"
                          />
                          {formErrors.phone && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {formErrors.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                            WhatsApp (Optional)
                          </label>
                          <input
                            type="tel"
                            value={requestData.whatsapp}
                            onChange={(e) => handleContactChange('whatsapp', e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary bg-amber-50 dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100 ${
                              formErrors.whatsapp ? 'border-red-500' : 'border-amber-200'
                            }`}
                            placeholder="0771234567 or +94771234567"
                          />
                          {formErrors.whatsapp && (
                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                              {formErrors.whatsapp}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                            Message (Optional)
                          </label>
                          <textarea
                            value={requestData.message}
                            onChange={(e) =>
                              setRequestData({ ...requestData, message: e.target.value })
                            }
                            rows="3"
                            className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-primary bg-amber-50 dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                            placeholder="Any questions or special requests..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            fullWidth
                            onClick={() => setShowRequestForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" fullWidth disabled={submitting}>
                            {submitting ? 'Sending...' : 'Send'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoomDetailModal;
