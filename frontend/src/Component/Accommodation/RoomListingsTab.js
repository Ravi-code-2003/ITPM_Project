import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Eye, Home } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { roomService } from '../../services/accommodationService';
import RoomFormModal from './RoomFormModal';
import toast from 'react-hot-toast';

const RoomListingsTab = ({ onUpdate }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getMyRooms();
      setRooms(response.data || []);
      onUpdate && onUpdate();
    } catch (error) {
      toast.error('Failed to fetch rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setShowModal(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      await roomService.deleteRoom(roomId);
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingRoom(null);
  };

  const handleRoomSaved = () => {
    setShowModal(false);
    setEditingRoom(null);
    fetchRooms();
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
            Your Room Listings
          </h2>
          <p className="text-sm text-secondary dark:text-gray-400 mt-1">
            Manage your available rooms and properties
          </p>
        </div>
        <Button onClick={handleAddRoom} icon={<Plus className="h-4 w-4" />}>
          Add New Room
        </Button>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="mx-auto h-12 w-12 text-secondary dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-primary dark:text-gray-100 mb-2">
              No rooms listed yet
            </h3>
            <p className="text-secondary dark:text-gray-400 mb-6">
              Start by adding your first room listing
            </p>
            <Button onClick={handleAddRoom}>Add Your First Room</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room._id} className="overflow-hidden">
              {/* Image */}
              <div className="relative h-48 bg-secondary/10">
                {room.images && room.images.length > 0 ? (
                  <img
                    src={room.images[0].startsWith('http') ? room.images[0] : `http://localhost:5000${room.images[0]}`}
                    alt={room.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-secondary/40" />
                  </div>
                )}
                {/* Availability Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      room.availability === 'AVAILABLE'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {room.availability}
                  </span>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-primary dark:text-gray-100 mb-1">
                  {room.title}
                </h3>
                <p className="text-secondary dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {room.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-primary dark:text-accent mr-2" />
                    <span className="text-secondary dark:text-gray-400">
                      {room.location?.area}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary dark:text-gray-100 font-semibold">
                      Rs. {room.monthlyRent?.toLocaleString()}/month
                    </span>
                    <span className="text-secondary dark:text-gray-400 flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {room.viewsCount || 0} views
                    </span>
                  </div>
                </div>

                {/* Stats */}
                {room.stats && (
                  <div className="flex gap-2 mb-4 text-xs">
                    {room.stats.pendingRequests > 0 && (
                      <span className="bg-accent/20 text-primary dark:text-accent px-2 py-1 rounded">
                        {room.stats.pendingRequests} requests
                      </span>
                    )}
                    {room.stats.activeOffers > 0 && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                        {room.stats.activeOffers} offers
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => handleEditRoom(room)}
                    icon={<Edit className="h-4 w-4" />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteRoom(room._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Room Form Modal */}
      {showModal && (
        <RoomFormModal
          room={editingRoom}
          onClose={handleModalClose}
          onSaved={handleRoomSaved}
        />
      )}
    </div>
  );
};

export default RoomListingsTab;
