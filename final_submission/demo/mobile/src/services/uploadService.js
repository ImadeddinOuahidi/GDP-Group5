import apiClient from './apiClient';
import { API_CONFIG } from '../config/constants';
import { Platform } from 'react-native';

const { ENDPOINTS } = API_CONFIG;

export const uploadService = {
  /**
   * Upload multiple files to the server (MinIO)
   * @param {Array} files - Array of file objects from image picker / document picker
   * @returns {Promise} Upload result with file keys and URLs
   */
  uploadFiles: async (files) => {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append('files', {
          uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          type: file.mimeType || file.type || 'image/jpeg',
          name: file.fileName || file.name || `upload_${Date.now()}.jpg`,
        });
      });

      const response = await apiClient.post(`${ENDPOINTS.UPLOADS}/multiple`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min for large uploads
      });

      return response.data;
    } catch (error) {
      console.error('Upload files error:', error);
      throw error;
    }
  },

  /**
   * Upload a single file
   * @param {Object} file - File object from image picker
   * @returns {Promise} Upload result with file key and URL
   */
  uploadSingle: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: file.mimeType || file.type || 'image/jpeg',
        name: file.fileName || file.name || `upload_${Date.now()}.jpg`,
      });

      const response = await apiClient.post(`${ENDPOINTS.UPLOADS}/single`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      return response.data;
    } catch (error) {
      console.error('Upload single file error:', error);
      throw error;
    }
  },

  /**
   * Check if upload service is available
   */
  checkStatus: async () => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.UPLOADS}/status`);
      return response.data;
    } catch (error) {
      console.error('Upload status error:', error);
      return { data: { available: false } };
    }
  },
};

export default uploadService;
