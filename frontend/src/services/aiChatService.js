import api from './api';

export const aiChatService = {
  getHistory: async () => {
    const response = await api.get('/ai/chat');
    return response.data;
  },

  sendMessage: async (message) => {
    const response = await api.post('/ai/chat', { message });
    return response.data;
  },
};
