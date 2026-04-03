import api from './api';

export const stickyNotesService = {
  getNotes: async () => {
    const response = await api.get('/student/sticky-notes');
    return response.data;
  },

  createNote: async (payload) => {
    const response = await api.post('/student/sticky-notes', payload);
    return response.data;
  },

  updateNote: async (id, payload) => {
    const response = await api.patch(`/student/sticky-notes/${id}`, payload);
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/student/sticky-notes/${id}`);
    return response.data;
  },
};
