/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Number} lat1 - Latitude of point 1
 * @param {Number} lon1 - Longitude of point 1
 * @param {Number} lat2 - Latitude of point 2
 * @param {Number} lon2 - Longitude of point 2
 * @returns {Number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate distance from room to campus
 * @param {Object} room - Room object with location.coordinates
 * @param {Array} campusCoordinates - [longitude, latitude] of campus
 * @returns {Number} Distance in kilometers
 */
function calculateRoomToCampusDistance(room, campusCoordinates) {
  if (!room.location || !room.location.coordinates || !room.location.coordinates.coordinates) {
    return null;
  }
  
  const [roomLng, roomLat] = room.location.coordinates.coordinates;
  const [campusLng, campusLat] = campusCoordinates;
  
  return calculateDistance(roomLat, roomLng, campusLat, campusLng);
}

module.exports = {
  calculateDistance,
  calculateRoomToCampusDistance,
};
