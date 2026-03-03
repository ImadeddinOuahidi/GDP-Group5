import apiClient from './apiClient';
import { API_CONFIG } from '../config/constants';

const { ENDPOINTS } = API_CONFIG;

export const authService = {
  /**
   * Login user
   */
  login: async (email, password) => {
    try {
      const response = await apiClient.post(ENDPOINTS.LOGIN, { email, password });
      return response.data;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.REGISTER, userData);
      return response.data;
    } catch (error) {
      console.error('Register service error:', error);
      throw error;
    }
  },

  /**
   * Get user profile
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put(ENDPOINTS.PROFILE, profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Request password reset
   */
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post(ENDPOINTS.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post(ENDPOINTS.RESET_PASSWORD, { 
        token, 
        password: newPassword 
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};

export default authService;
