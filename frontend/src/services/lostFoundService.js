import api from './api';

export const lostFoundService = {
  getItems: async (params = {}) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await api.get(`/student/lost-found${query.toString() ? `?${query.toString()}` : ''}`);
    return response.data;
  },

  createItem: async (formData) => {
    const response = await api.post('/student/lost-found', formData);
    return response.data;
  },

  updateItem: async (id, formData) => {
    const response = await api.patch(`/student/lost-found/${id}`, formData);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/student/lost-found/${id}`);
    return response.data;
  },

  sendResponse: async (id, payload) => {
    const response = await api.post(`/student/lost-found/${id}/respond`, payload);
    return response.data;
  },

  resolveItem: async (id, responseId) => {
    const response = await api.patch(`/student/lost-found/${id}/resolve/${responseId}`);
    return response.data;
  },
};
