import React, { useState } from 'react';
import { MapPin, Wifi, Car, Bath, Eye, Gift, ChevronLeft, ChevronRight } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const RoomCard = ({ room, onViewDetails, showMatchScore = false, matchScore = null }) => {
  const {
    _id,
    title,
    monthlyRent,
    location,
    facilities,
    availability,
    images,
    viewsCount,
    roomType,
    gender,
    activeOffers,
    campusDistance,
    campusName,
  } = room;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = images && images.length > 1;

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Get top facilities
  const topFacilities = [];
  if (facilities?.wifi) topFacilities.push({ icon: Wifi, label: 'WiFi' });
  if (facilities?.parking) topFacilities.push({ icon: Car, label: 'Parking' });
  if (facilities?.attachedBathroom) topFacilities.push({ icon: Bath, label: 'Bathroom' });

  // Check if there's an active offer
  const hasOffer = activeOffers && activeOffers.length > 0;
  const bestOffer = hasOffer ? activeOffers[0] : null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full" padding="none">
      {/* Image with Carousel */}
      <div className="relative h-44 bg-gray-200 group flex-shrink-0">
        {images && images.length > 0 ? (
          <>
            <img
              src={images[currentImageIndex].startsWith('http') ? images[currentImageIndex] : `http://localhost:5000${images[currentImageIndex]}`}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-300"><span class="text-gray-500">Failed to load image</span></div>';
              }}
            />
            
            {/* Image Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-800" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 text-gray-800" />
                </button>
                
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'w-4 bg-white'
                          : 'w-1 bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500">No Image</span>
          </div>
        )}

        {/* Availability Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              availability === 'AVAILABLE'
                ? 'bg-white text-gray-800'
                : 'bg-red-500 text-white'
            }`}
          >
            {availability === 'AVAILABLE' ? 'Available' : 'Not Available'}
          </span>
        </div>

        {/* Offer Badge */}
        {hasOffer && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500 text-white flex items-center gap-1">
              <Gift className="h-3 w-3" />
              Offer
            </span>
          </div>
        )}

        {/* Match Score */}
        {showMatchScore && matchScore !== null && (
          <div className="absolute bottom-2 right-2">
            <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-medium">
              {matchScore}% Match
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-3 flex flex-col flex-grow">
        {/* Room Type & Gender - Moved to top */}
        <div className="flex gap-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
          <span>{roomType}</span>
          <span>•</span>
          <span className="capitalize">{gender === 'any' ? 'Any Gender' : gender}</span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base text-primary dark:text-gray-100 mb-1 line-clamp-1">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-start gap-1 text-xs text-secondary dark:text-gray-400 mb-2">
          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{location?.area || 'Unknown Location'}</span>
        </div>

        {/* Campus Distance */}
        {campusDistance && (
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            {campusDistance} km from {campusName || 'Campus'}
          </div>
        )}

        {/* Top Facilities and View Count */}
        <div className="flex items-center flex-wrap gap-3 mb-2 text-xs text-secondary dark:text-gray-400">
          {topFacilities.length > 0 && (
            <>
              {topFacilities.map(({ icon: Icon, label }, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </div>
              ))}
            </>
          )}
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Eye className="h-3.5 w-3.5" />
            <span>{viewsCount || 0} views</span>
          </div>
        </div>

        {/* Spacer to push content to bottom */}
        <div className="flex-grow"></div>

        {/* Rent with Offer */}
        <div className="flex items-baseline gap-2 mb-2">
          {hasOffer && bestOffer.discountType !== 'none' ? (
            <>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                Rs. {calculateDiscountedPrice(monthlyRent, bestOffer).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 line-through">
                Rs. {monthlyRent.toLocaleString()}
              </span>
              <span className="text-xs text-gray-600">/month</span>
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-primary dark:text-gray-100">
                Rs. {monthlyRent.toLocaleString()}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">/month</span>
            </>
          )}
        </div>

        {/* View Details Button */}
        <Button
          onClick={() => onViewDetails(_id)}
          variant="primary"
          className="w-full py-2 text-sm"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate discounted price
function calculateDiscountedPrice(originalPrice, offer) {
  if (!offer || offer.discountType === 'none') return originalPrice;

  if (offer.discountType === 'fixed') {
    return Math.max(0, originalPrice - offer.discountAmount);
  } else if (offer.discountType === 'percentage') {
    return Math.max(0, originalPrice - (originalPrice * offer.discountPercent / 100));
  }

  return originalPrice;
}

export default RoomCard;
