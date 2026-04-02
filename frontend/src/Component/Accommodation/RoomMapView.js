import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import Button from '../../components/ui/Button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RoomMapView = ({ rooms, onRoomClick }) => {
  // Default center: Colombo, Sri Lanka
  const defaultCenter = [6.9271, 79.8612];

  // Calculate center based on rooms if available
  const getMapCenter = () => {
    if (rooms.length === 0) return defaultCenter;

    const validRooms = rooms.filter(
      (room) =>
        room.location?.coordinates?.coordinates &&
        room.location.coordinates.coordinates.length === 2
    );

    if (validRooms.length === 0) return defaultCenter;

    const avgLat =
      validRooms.reduce(
        (sum, room) => sum + room.location.coordinates.coordinates[1],
        0
      ) / validRooms.length;
    const avgLng =
      validRooms.reduce(
        (sum, room) => sum + room.location.coordinates.coordinates[0],
        0
      ) / validRooms.length;

    return [avgLat, avgLng];
  };

  return (
    <div className="h-[600px] rounded-lg overflow-hidden border-2 border-amber-200 dark:border-gray-700 bg-amber-50/70 dark:bg-gray-900/40">
      <MapContainer
        center={getMapCenter()}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {rooms
          .filter(
            (room) =>
              room.location?.coordinates?.coordinates &&
              room.location.coordinates.coordinates.length === 2
          )
          .map((room) => (
            <Marker
              key={room._id}
              position={[
                room.location.coordinates.coordinates[1],
                room.location.coordinates.coordinates[0],
              ]}
            >
              <Popup>
                <div className="min-w-[200px]">
                  {room.images && room.images[0] && (
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-primary mb-1">{room.title}</h3>
                  <p className="text-sm text-secondary mb-1">{room.location.area}</p>
                  <p className="font-semibold text-primary mb-2">
                    Rs. {room.monthlyRent?.toLocaleString()}/month
                  </p>
                  <Button size="sm" fullWidth onClick={() => onRoomClick(room)}>
                    View Details
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {rooms.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-50/85 dark:bg-gray-900/80">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-secondary dark:text-gray-600 mx-auto mb-2" />
            <p className="text-secondary dark:text-gray-400">No rooms to display on map</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomMapView;
