import axios from 'axios';
import toast from 'react-hot-toast';

// Debug mode
const DEBUG = process.env.NODE_ENV === 'development';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

const AI_REQUEST_TIMEOUT_MS = parseInt(process.env.REACT_APP_AI_TIMEOUT_MS, 10) || 120000;

// Debug logging
if (DEBUG) {
  console.log('🔧 API Service Initialized');
  console.log('📍 Base URL:', api.defaults.baseURL);
  console.log('🌐 Environment:', process.env.NODE_ENV);
}

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If the data is FormData, remove Content-Type header to let axios set it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Debug request
    if (DEBUG && config.url?.includes('/auth/login')) {
      console.log('🚀 Making login request:', {
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        method: config.method,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    if (DEBUG) {
      console.error('❌ Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => {
    // Debug successful response
    if (DEBUG && response.config.url?.includes('/auth/login')) {
      console.log('✅ Login response received:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });
    }
    return response;
  },
  (error) => {
    // Debug error response
    if (DEBUG) {
      console.error('❌ API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
      });
    }

    const message = error.response?.data?.message || error.message || 'Network error occurred';
    
    // Don't show toast for certain paths to avoid conflicts
    const skipPaths = ['/auth/login', '/auth/register'];
    const isSkip = skipPaths.some(path => error.config?.url?.includes(path));
    
    if (!isSkip) {
      toast.error(message);
    }
    
    // Redirect to login on 401 errors (but not for login endpoint itself)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Login
  login: async (credentials) => {
    try {
      if (DEBUG) {
        console.log('🔐 Attempting login with:', { email: credentials.email });
      }
      
      const response = await api.post('/auth/login', credentials);
      
      if (DEBUG) {
        console.log('✅ Login API success:', response.data);
      }
      
      return response.data;
    } catch (error) {
      if (DEBUG) {
        console.error('❌ Login API failed:', {
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    // If userData is already FormData, send it directly
    if (userData instanceof FormData) {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } else if (userData.proofImage instanceof File) {
      // Convert to FormData
      const formData = new FormData();
      Object.keys(userData).forEach(key => {
        formData.append(key, userData[key]);
      });
      const response = await api.post('/auth/register', formData);
      return response.data;
    } else {
      const response = await api.post('/auth/register', userData);
      return response.data;
    }
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },
};

// Admin API calls
export const adminAPI = {
  // Get dashboard stats
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  // Get all users
  getUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await api.get(`/admin/users?${queryParams}`);
    return response.data;
  },

  // Get pending users
  getPendingUsers: async () => {
    const response = await api.get('/admin/pending-users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Approve user
  approveUser: async (id) => {
    const response = await api.put(`/admin/approve-user/${id}`);
    return response.data;
  },

  // Reject user
  rejectUser: async (id) => {
    const response = await api.put(`/admin/reject-user/${id}`);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/delete-user/${id}`);
    return response.data;
  },
};

// AI Chat API calls
export const aiAPI = {
  getChatHistory: async () => {
    const response = await api.get("/ai/chat");
    return response.data;
  },

  sendMessage: async (message) => {
    const response = await api.post("/ai/chat", { message }, { timeout: AI_REQUEST_TIMEOUT_MS });
    return response.data;
  },
};

// Notes API calls
export const notesAPI = {
  getStickyNotes: async () => {
    const response = await api.get("/notes/sticky");
    return response.data;
  },

  getTodos: async () => {
    const response = await api.get("/notes/todos");
    return response.data;
  },

  createNote: async (payload) => {
    const response = await api.post("/notes", payload);
    return response.data;
  },

  toggleTodoCompletion: async (id, completed) => {
    const response = await api.patch(`/notes/${id}/complete`, { completed });
    return response.data;
  },

  updateTodo: async (id, payload) => {
    const response = await api.patch(`/notes/${id}`, payload);
    return response.data;
  },

  deleteNote: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  },
};

// Lost & Found API calls
export const lostFoundAPI = {
  createPost: async (formData) => {
    const response = await api.post("/lostfound", formData);
    return response.data;
  },

  getLostPosts: async () => {
    const response = await api.get("/lostfound/lost");
    return response.data;
  },

  getFoundPosts: async () => {
    const response = await api.get("/lostfound/found");
    return response.data;
  },

  getCurrentUserPosts: async () => {
    const response = await api.get("/lostfound/user");
    return response.data;
  },

  deletePost: async (id) => {
    const response = await api.delete(`/lostfound/${id}`);
    return response.data;
  },

  resolvePost: async (id) => {
    const response = await api.patch(`/lostfound/${id}/resolve`);
    return response.data;
  },

  getMatchesByLostId: async (lostId) => {
    const response = await api.get(`/lostfound/matches/${lostId}`);
    return response.data;
  },
};

export default api;
