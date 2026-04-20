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
   * Change password (authenticated)
   */
  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const response = await apiClient.put(ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
};

export default authService;
