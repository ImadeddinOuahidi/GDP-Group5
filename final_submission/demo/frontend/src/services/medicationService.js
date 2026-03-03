/**
 * Medication Service
 * 
 * Frontend service for the simplified medication system.
 * Handles all API calls related to medications for both doctors and patients.
 */

import apiClient from './apiClient';
import { ROUTES } from '../config/constants';

// Demo medications for offline/fallback mode
const DEMO_MEDICATIONS = [
  {
    _id: 'demo-med-1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg', '650mg', '1000mg'],
    description: 'Pain reliever and fever reducer',
    isVerified: true
  },
  {
    _id: 'demo-med-2',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    category: 'Analgesic',
    dosageForm: 'Tablet',
    commonStrengths: ['200mg', '400mg', '600mg'],
    description: 'Anti-inflammatory pain reliever',
    isVerified: true
  },
  {
    _id: 'demo-med-3',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    dosageForm: 'Capsule',
    commonStrengths: ['250mg', '500mg'],
    description: 'Penicillin-type antibiotic for bacterial infections',
    isVerified: true
  },
  {
    _id: 'demo-med-4',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['5mg', '10mg', '20mg'],
    description: 'ACE inhibitor for blood pressure',
    isVerified: true
  },
  {
    _id: 'demo-med-5',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    category: 'Diabetes',
    dosageForm: 'Tablet',
    commonStrengths: ['500mg', '850mg', '1000mg'],
    description: 'Oral diabetes medication',
    isVerified: true
  },
  {
    _id: 'demo-med-6',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    commonStrengths: ['20mg', '40mg'],
    description: 'Proton pump inhibitor for acid reflux',
    isVerified: true
  },
  {
    _id: 'demo-med-7',
    name: 'Cetirizine',
    genericName: 'Cetirizine HCl',
    category: 'Antihistamine',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg'],
    description: 'Antihistamine for allergies',
    isVerified: true
  },
  {
    _id: 'demo-med-8',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    commonStrengths: ['10mg', '20mg', '40mg'],
    description: 'Statin for cholesterol management',
    isVerified: true
  }
];

class MedicationService {
  constructor() {
    this.baseUrl = ROUTES.API.MEDICATIONS;
  }

  /**
   * Check if running in demo mode
   */
  isDemoMode() {
    const token = localStorage.getItem('token');
    return token && token.startsWith('demo-token');
  }

  /**
   * Handle API errors consistently
   */
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('MedicationService Error:', message);
    throw new Error(message);
  }

  // ==================== SEARCH & DISCOVERY ====================

  /**
   * Search medications by name or generic name
   * @param {string} query - Search term
   * @param {Object} options - Search options (category, limit, verified)
   */
  async search(query, options = {}) {
    try {
      // Demo mode fallback
      if (this.isDemoMode()) {
        return this.searchDemoMedications(query);
      }

      const params = {
        q: query,
        ...options
      };

      const response = await apiClient.get(`${this.baseUrl}/search`, { params });
      return response.data;
    } catch (error) {
      console.log('API search failed, using demo medications');
      return this.searchDemoMedications(query);
    }
  }

  /**
   * Search demo medications for offline mode
   */
  searchDemoMedications(query) {
    if (!query || query.length < 1) {
      return {
        success: true,
        data: { medications: DEMO_MEDICATIONS.slice(0, 5), type: 'popular' }
      };
    }

    const filtered = DEMO_MEDICATIONS.filter(med =>
      med.name.toLowerCase().includes(query.toLowerCase()) ||
      med.genericName.toLowerCase().includes(query.toLowerCase()) ||
      med.category.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: { medications: filtered, searchTerm: query, count: filtered.length }
    };
  }

  /**
   * Get popular medications
   * @param {number} limit - Number of medications to return
   */
  async getPopular(limit = 10) {
    try {
      if (this.isDemoMode()) {
        return {
          success: true,
          data: { medications: DEMO_MEDICATIONS.slice(0, limit) }
        };
      }

      const response = await apiClient.get(`${this.baseUrl}/popular`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      return {
        success: true,
        data: { medications: DEMO_MEDICATIONS.slice(0, limit) }
      };
    }
  }

  /**
   * Get medications by category
   * @param {string} category - Medication category
   * @param {number} limit - Number of medications to return
   */
  async getByCategory(category, limit = 50) {
    try {
      if (this.isDemoMode()) {
        const filtered = DEMO_MEDICATIONS.filter(m => m.category === category);
        return { success: true, data: { medications: filtered, category } };
      }

      const response = await apiClient.get(`${this.baseUrl}/category/${category}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get all categories with counts
   */
  async getCategories() {
    try {
      if (this.isDemoMode()) {
        const categories = ['Analgesic', 'Antibiotic', 'Cardiovascular', 'Diabetes', 'Gastrointestinal', 'Antihistamine'];
        return {
          success: true,
          data: {
            categories: categories.map(name => ({ name, count: 1 })),
            dosageForms: ['Tablet', 'Capsule', 'Liquid/Syrup', 'Injection', 'Cream/Ointment']
          }
        };
      }

      const response = await apiClient.get(`${this.baseUrl}/categories`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get medication by ID
   * @param {string} id - Medication ID
   */
  async getById(id) {
    try {
      if (this.isDemoMode()) {
        const medication = DEMO_MEDICATIONS.find(m => m._id === id);
        if (medication) {
          return { success: true, data: { medication } };
        }
        throw new Error('Medication not found');
      }

      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== DOCTOR/ADMIN OPERATIONS ====================

  /**
   * Get all medications with filtering (Doctor/Admin)
   * @param {Object} params - Query parameters
   */
  async getAll(params = {}) {
    try {
      const response = await apiClient.get(this.baseUrl, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Create a new medication (Doctor/Admin)
   * @param {Object} medicationData - Medication data
   */
  async create(medicationData) {
    try {
      const response = await apiClient.post(this.baseUrl, medicationData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Update a medication (Doctor/Admin)
   * @param {string} id - Medication ID
   * @param {Object} updateData - Update data
   */
  async update(id, updateData) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}`, updateData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Delete a medication (Doctor/Admin)
   * @param {string} id - Medication ID
   */
  async delete(id) {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verify a patient-created medication (Doctor/Admin)
   * @param {string} id - Medication ID
   */
  async verify(id) {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}/verify`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get unverified medications (Doctor/Admin)
   * @param {Object} params - Query parameters
   */
  async getUnverified(params = {}) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/unverified`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get medication statistics (Doctor/Admin)
   */
  async getStats() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ==================== PATIENT OPERATIONS ====================

  /**
   * Create a custom medication (Patient)
   * Used when patient can't find their medication in the list
   * @param {Object} medicationData - Medication data
   */
  async createPatientMedication(medicationData) {
    try {
      const response = await apiClient.post(`${this.baseUrl}/patient`, medicationData);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Export singleton instance
const medicationService = new MedicationService();
export default medicationService;
