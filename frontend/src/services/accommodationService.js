import api from './api';

// Room APIs
export const roomService = {
  // Get all rooms with filters
  getAllRooms: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    const response = await api.get(`/rooms?${params.toString()}`);
    return response.data;
  },

  // Get campuses
  getCampuses: async () => {
    const response = await api.get('/rooms/campuses');
    return response.data;
  },

  // Get single room
  getRoom: async (id) => {
    const response = await api.get(`/rooms/${id}`);
    return response.data;
  },

  // Get my rooms (house owner)
  getMyRooms: async () => {
    const response = await api.get('/rooms/my-rooms/all');
    return response.data;
  },

  // Create room
  createRoom: async (formData) => {
    const response = await api.post('/rooms', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update room
  updateRoom: async (id, formData) => {
    const response = await api.put(`/rooms/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete room image
  deleteRoomImage: async (id, imageUrl) => {
    const response = await api.delete(`/rooms/${id}/images`, {
      data: { imageUrl },
    });
    return response.data;
  },

  // Delete room
  deleteRoom: async (id) => {
    const response = await api.delete(`/rooms/${id}`);
    return response.data;
  },
};

// Room Request APIs
export const roomRequestService = {
  // Create room request (student)
  createRequest: async (roomId, data) => {
    const response = await api.post(`/rooms/${roomId}/requests`, data);
    return response.data;
  },

  // Get owner's requests
  getOwnerRequests: async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/room-requests/owner${params}`);
    return response.data;
  },

  // Get student's requests
  getStudentRequests: async () => {
    const response = await api.get('/room-requests/student');
    return response.data;
  },

  // Respond to request (owner)
  respondToRequest: async (id, data) => {
    const response = await api.put(`/room-requests/${id}/respond`, data);
    return response.data;
  },

  // Get requests for a specific room
  getRoomRequests: async (roomId) => {
    const response = await api.get(`/rooms/${roomId}/requests`);
    return response.data;
  },

  // Cancel request (student)
  cancelRequest: async (id) => {
    const response = await api.delete(`/room-requests/${id}`);
    return response.data;
  },
};

// Room Offer APIs
export const roomOfferService = {
  // Create offer
  createOffer: async (roomId, data) => {
    const response = await api.post(`/rooms/${roomId}/offers`, data);
    return response.data;
  },

  // Get room offers
  getRoomOffers: async (roomId, includeExpired = false) => {
    const params = includeExpired ? '?includeExpired=true' : '';
    const response = await api.get(`/rooms/${roomId}/offers${params}`);
    return response.data;
  },

  // Get my offers (owner)
  getMyOffers: async () => {
    const response = await api.get('/room-offers/my-offers');
    return response.data;
  },

  // Update offer
  updateOffer: async (id, data) => {
    const response = await api.put(`/room-offers/${id}`, data);
    return response.data;
  },

  // Toggle offer status
  toggleOfferStatus: async (id) => {
    const response = await api.patch(`/room-offers/${id}/toggle`);
    return response.data;
  },

  // Delete offer
  deleteOffer: async (id) => {
    const response = await api.delete(`/room-offers/${id}`);
    return response.data;
  },
};
