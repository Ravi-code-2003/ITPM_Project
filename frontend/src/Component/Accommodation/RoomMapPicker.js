import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return position === null ? null : <Marker position={[position.lat, position.lng]} />;
}

const RoomMapPicker = ({ initialLat, initialLng, onSelect, onClose }) => {
  const [position, setPosition] = useState({
    lat: initialLat || 6.9271,
    lng: initialLng || 79.8612,
  });

  const handleConfirm = () => {
    onSelect(position.lat, position.lng);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-primary dark:text-gray-100">
              Select Location on Map
            </h2>
            <button
              onClick={onClose}
              className="text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-secondary dark:text-gray-400 mb-4">
            Click on the map to set the room location. You can zoom and pan to find the exact location.
          </p>

          <div className="mb-4 h-96 rounded-lg overflow-hidden border-2 border-secondary/20">
            <MapContainer
              center={[position.lat, position.lng]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>

          <div className="mb-4 p-3 bg-background dark:bg-background-dark rounded-lg">
            <p className="text-sm text-primary dark:text-gray-100">
              <strong>Selected Coordinates:</strong> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Confirm Location
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RoomMapPicker;
