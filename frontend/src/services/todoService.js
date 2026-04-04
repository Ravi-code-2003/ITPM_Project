import api from './api';

export const todoService = {
  getTodos: async (completed = null) => {
    const params = completed !== null ? `?completed=${completed}` : '';
    const response = await api.get(`/student/todos${params}`);
    return response.data;
  },

  createTodo: async (payload) => {
    const response = await api.post('/student/todos', payload);
    return response.data;
  },

  updateTodo: async (id, payload) => {
    const response = await api.patch(`/student/todos/${id}`, payload);
    return response.data;
  },

  toggleTodo: async (id) => {
    const response = await api.patch(`/student/todos/${id}/toggle`);
    return response.data;
  },

  deleteTodo: async (id) => {
    const response = await api.delete(`/student/todos/${id}`);
    return response.data;
  },
};
