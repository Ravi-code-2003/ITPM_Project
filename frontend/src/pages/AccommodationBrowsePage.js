import React, { useState, useEffect, useContext } from 'react';
import { MapPin, DollarSign, Wifi, Search, Filter, Map, List, Eye, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import { roomService } from '../services/accommodationService';
import { AuthContext } from '../contexts/AuthContext';
import RoomDetailModal from '../Component/Accommodation/RoomDetailModal';
import RoomMapView from '../Component/Accommodation/RoomMapView';
import toast from 'react-hot-toast';

const AccommodationBrowsePage = () => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    area: '',
    minRent: '',
    maxRent: '',
    roomType: '',
    gender: '',
    wifi: false,
    parking: false,
    attachedBathroom: false,
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms({
        ...appliedFilters,
        availability: 'AVAILABLE',
      });
      setRooms(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchRooms(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      area: '',
      minRent: '',
      maxRent: '',
      roomType: '',
      gender: '',
      wifi: false,
      parking: false,
      attachedBathroom: false,
    });
    fetchRooms();
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
  };

  const getFacilityIcons = (facilities) => {
    const icons = [];
    if (facilities.wifi) icons.push({ icon: Wifi, label: 'WiFi' });
    if (facilities.parking) icons.push({ icon: '🚗', label: 'Parking' });
    if (facilities.attachedBathroom) icons.push({ icon: '🚿', label: 'Bathroom' });
    if (facilities.furnished) icons.push({ icon: '🛋️', label: 'Furnished' });
    return icons.slice(0, 4); // Show only first 4
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary dark:text-gray-100">
            Find Your Perfect Room
          </h1>
          <p className="text-secondary dark:text-gray-400 mt-2">
            Browse available rooms and accommodations near your university
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              icon={<Filter className="h-4 w-4" />}
            >
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              icon={<List className="h-4 w-4" />}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              icon={<Map className="h-4 w-4" />}
            >
              Map
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Area/Location
                  </label>
                  <input
                    type="text"
                    value={filters.area}
                    onChange={(e) => handleFilterChange('area', e.target.value)}
                    placeholder="e.g., Malabe, Nugegoda"
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Min Rent (Rs.)
                  </label>
                  <input
                    type="number"
                    value={filters.minRent}
                    onChange={(e) => handleFilterChange('minRent', e.target.value)}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Max Rent (Rs.)
                  </label>
                  <input
                    type="number"
                    value={filters.maxRent}
                    onChange={(e) => handleFilterChange('maxRent', e.target.value)}
                    placeholder="50000"
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary dark:text-gray-300 mb-1">
                    Room Type
                  </label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">All Types</option>
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
                    value={filters.gender}
                    onChange={(e) => handleFilterChange('gender', e.target.value)}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-lg focus:ring-2 focus:ring-primary dark:bg-surface-dark dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="w-full space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.wifi}
                        onChange={(e) => handleFilterChange('wifi', e.target.checked)}
                        className="rounded border-secondary/30 text-primary focus:ring-primary mr-2"
                      />
                      <span className="text-sm text-primary dark:text-gray-300">WiFi</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.parking}
                        onChange={(e) => handleFilterChange('parking', e.target.checked)}
                        className="rounded border-secondary/30 text-primary focus:ring-primary mr-2"
                      />
                      <span className="text-sm text-primary dark:text-gray-300">Parking</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.attachedBathroom}
                        onChange={(e) => handleFilterChange('attachedBathroom', e.target.checked)}
                        className="rounded border-secondary/30 text-primary focus:ring-primary mr-2"
                      />
                      <span className="text-sm text-primary dark:text-gray-300">Attached Bathroom</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowFilters(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyFilters}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content */}
        {viewMode === 'grid' ? (
          <>
            {/* Results Count */}
            <div className="mb-4">
              <p className="text-secondary dark:text-gray-400">
                {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
              </p>
            </div>

            {/* Rooms Grid */}
            {rooms.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="mx-auto h-12 w-12 text-secondary dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-primary dark:text-gray-100 mb-2">
                    No rooms found
                  </h3>
                  <p className="text-secondary dark:text-gray-400 mb-6">
                    Try adjusting your filters or clearing them
                  </p>
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room) => (
                  <Card
                    key={room._id}
                    className="overflow-hidden cursor-pointer"
                    onClick={() => handleRoomClick(room)}
                    hover
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-secondary/10">
                      {room.images && room.images.length > 0 ? (
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <MapPin className="h-12 w-12 text-secondary/40" />
                        </div>
                      )}

                      {/* Offers Badge */}
                      {room.activeOffers && room.activeOffers.length > 0 && (
                        <div className="absolute top-3 left-3">
                          <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            {room.activeOffers.length} {room.activeOffers.length === 1 ? 'Offer' : 'Offers'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg text-primary dark:text-gray-100 mb-1">
                        {room.title}
                      </h3>
                      <p className="text-secondary dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {room.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 text-primary dark:text-accent mr-2" />
                          <span className="text-secondary dark:text-gray-400">
                            {room.location?.area}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-primary dark:text-gray-100 font-semibold text-lg">
                            Rs. {room.monthlyRent?.toLocaleString()}/month
                          </span>
                          <span className="text-secondary dark:text-gray-400 flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {room.viewsCount || 0}
                          </span>
                        </div>
                      </div>

                      {/* Facilities Icons */}
                      <div className="flex gap-2 text-xs">
                        {getFacilityIcons(room.facilities).map((facility, index) => (
                          <span
                            key={index}
                            className="bg-accent/20 text-primary dark:text-accent px-2 py-1 rounded"
                          >
                            {typeof facility.icon === 'string' ? facility.icon : <facility.icon className="h-3 w-3" />}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <RoomMapView rooms={rooms} onRoomClick={handleRoomClick} />
        )}

        {/* Room Detail Modal */}
        {selectedRoom && (
          <RoomDetailModal
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AccommodationBrowsePage;
