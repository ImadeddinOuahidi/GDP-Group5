import apiClient from './apiClient';
import { API_CONFIG } from '../config/constants';

const { ENDPOINTS } = API_CONFIG;

export const medicationService = {
  /**
   * Get all medications with pagination
   */
  getAllMedications: async (params = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.MEDICATIONS, { params });
      return response.data;
    } catch (error) {
      console.error('Get medications error:', error);
      throw error;
    }
  },

  /**
   * Get single medication by ID
   */
  getMedicationById: async (id) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.MEDICATIONS}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get medication error:', error);
      throw error;
    }
  },

  /**
   * Fuzzy search medications
   */
  searchMedications: async (query, options = {}) => {
    try {
      const response = await apiClient.get(ENDPOINTS.MEDICATION_SEARCH, {
        params: { q: query, ...options },
      });
      return response.data;
    } catch (error) {
      console.error('Search medications error:', error);
      throw error;
    }
  },

  /**
   * Get popular medications
   */
  getPopularMedications: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.MEDICATION_POPULAR);
      return response.data;
    } catch (error) {
      console.error('Get popular medications error:', error);
      throw error;
    }
  },

  /**
   * Create new medication (Doctor/Admin only)
   */
  createMedication: async (medicationData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.MEDICATIONS, medicationData);
      return response.data;
    } catch (error) {
      console.error('Create medication error:', error);
      throw error;
    }
  },

  /**
   * Update medication (Doctor/Admin only)
   */
  updateMedication: async (id, medicationData) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.MEDICATIONS}/${id}`, medicationData);
      return response.data;
    } catch (error) {
      console.error('Update medication error:', error);
      throw error;
    }
  },

  /**
   * Delete medication (Admin only)
   */
  deleteMedication: async (id) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.MEDICATIONS}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete medication error:', error);
      throw error;
    }
  },

  /**
   * Search medications by category
   */
  createPatientMedication: async (medicationData) => {
    try {
      const response = await apiClient.post(ENDPOINTS.MEDICATION_PATIENT, medicationData);
      return response.data;
    } catch (error) {
      console.error('Create patient medication error:', error);
      throw error;
    }
  },
};

export default medicationService;
