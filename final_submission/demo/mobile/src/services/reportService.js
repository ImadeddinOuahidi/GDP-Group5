import apiClient from './apiClient';
import { API_CONFIG } from '../config/constants';

const { ENDPOINTS } = API_CONFIG;

export const reportService = {
  /**
   * Get all reports with optional filters
   */
  getAllReports: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.REPORTS, { params });
      return response.data;
    } catch (error) {
      console.error('Get reports error:', error);
      throw error;
    }
  },

  /**
   * Get single report by ID
   */
  getReportById: async (id) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPORTS}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get report error:', error);
      throw error;
    }
  },

  /**
   * Submit new report (manual)
   */
  submitReport: async (reportData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.REPORTS, reportData);
      return response.data;
    } catch (error) {
      console.error('Submit report error:', error);
      throw error;
    }
  },

  /**
   * Submit report with AI processing (multimodal)
   */
  submitAIReport: async (formData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AI_SUBMIT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Submit AI report error:', error);
      throw error;
    }
  },

  /**
   * Confirm AI-processed report
   */
  confirmAIReport: async (confirmData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.AI_CONFIRM, confirmData);
      return response.data;
    } catch (error) {
      console.error('Confirm AI report error:', error);
      throw error;
    }
  },

  /**
   * Update existing report
   */
  updateReport: async (id, reportData) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.REPORTS}/${id}`, reportData);
      return response.data;
    } catch (error) {
      console.error('Update report error:', error);
      throw error;
    }
  },

  /**
   * Delete report
   */
  deleteReport: async (id) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.REPORTS}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete report error:', error);
      throw error;
    }
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.REPORTS}/dashboard`);
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },
};

export default reportService;
