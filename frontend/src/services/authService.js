import { authAPI } from './api';

// Auth service that wraps the authAPI calls
const authService = {
  // Login
  login: async (credentials) => {
    try {
      const data = await authAPI.login(credentials);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register
  register: async (userData) => {
    try {
      const data = await authAPI.register(userData);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Check if user is logged in
  isLoggedIn: () => {
    return !!localStorage.getItem('token');
  },

  // Get user profile
  getProfile: async () => {
    try {
      const data = await authAPI.getProfile();
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load profile');
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const data = await authAPI.forgotPassword(email);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send recovery email');
    }
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    try {
      const data = await authAPI.verifyOTP(email, otp);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid or expired OTP');
    }
  },

  // Reset password
  resetPassword: async (email, otp, newPassword) => {
    try {
      const data = await authAPI.resetPassword(email, otp, newPassword);
      return data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },
};

export default authService;