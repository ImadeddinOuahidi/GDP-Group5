import apiClient from './apiClient';
import { ROUTES } from '../config/constants';

class MedicineService {
  // Get all medicines with filters and pagination
  async getAllMedicines(params = {}) {
    try {
      const response = await apiClient.get(ROUTES.API.MEDICINES, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Search medicines
  async searchMedicines(query, options = {}) {
    try {
      const params = { query, ...options };
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/search`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get medicine by ID
  async getMedicineById(id) {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new medicine (Doctor/Admin only)
  async createMedicine(medicineData) {
    try {
      const response = await apiClient.post(ROUTES.API.MEDICINES, medicineData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update medicine (Doctor/Admin only)
  async updateMedicine(id, updateData) {
    try {
      const response = await apiClient.put(`${ROUTES.API.MEDICINES}/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update medicine stock
  async updateMedicineStock(id, stockData) {
    try {
      const response = await apiClient.put(`${ROUTES.API.MEDICINES}/${id}/stock`, stockData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete medicine (Admin only)
  async deleteMedicine(id, reason) {
    try {
      const response = await apiClient.delete(`${ROUTES.API.MEDICINES}/${id}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get medicines by category
  async getMedicinesByCategory(category, options = {}) {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/category/${category}`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get prescription medicines
  async getPrescriptionMedicines(options = {}) {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/prescription`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get OTC medicines
  async getOTCMedicines(options = {}) {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/otc`, {
        params: options
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get low stock medicines (Doctor/Admin only)
  async getLowStockMedicines() {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/low-stock`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Fuzzy search medicines
  async fuzzySearchMedicines(query, options = {}) {
    try {
      const params = { query, ...options };
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/fuzzy-search`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get medicine suggestions for autocomplete
  async getMedicineSuggestions(query, limit = 5) {
    try {
      const params = { query, limit };
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/suggestions`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Find exact medicine matches
  async findExactMatches(query) {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/exact-matches`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get search analytics (Admin/Doctor only)
  async getSearchAnalytics() {
    try {
      const response = await apiClient.get(`${ROUTES.API.MEDICINES}/search-analytics`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Refresh search index (Admin only)
  async refreshSearchIndex() {
    try {
      const response = await apiClient.post(`${ROUTES.API.MEDICINES}/refresh-index`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;
    const validationErrors = error.response?.data?.errors;

    return {
      message,
      status,
      validationErrors,
      originalError: error
    };
  }
}

export default new MedicineService();