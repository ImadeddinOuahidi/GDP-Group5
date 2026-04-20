import apiClient from './apiClient';
import { API_CONFIG } from '../config/constants';

const { ENDPOINTS } = API_CONFIG;

export const notificationService = {
  getNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.NOTIFICATIONS, { params });
      return response.data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.NOTIFICATIONS}/${id}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.NOTIFICATIONS}/mark-all-read`);
      return response.data;
    } catch (error) {
      console.error('Mark all read error:', error);
      throw error;
    }
  },
};

export default notificationService;
