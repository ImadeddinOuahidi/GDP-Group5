import apiClient from './apiClient';
import { ROUTES } from '../config/constants';

class ReportService {
  // Get all reports with filters and pagination
  async getAllReports(params = {}) {
    try {
      // Check if we're in demo mode
      const token = localStorage.getItem('token');
      if (token && token.startsWith('demo-token')) {
        // Return demo reports for demo mode
        return {
          status: 'success',
          data: [
            {
              _id: 'demo-report-1',
              medicine: { name: 'Paracetamol', genericName: 'Acetaminophen' },
              sideEffects: [{ effect: 'Mild headache after taking medication', severity: 'Mild' }],
              medicationUsage: { dosage: { amount: '500mg' } },
              status: 'pending',
              createdAt: new Date().toISOString(),
              reportDetails: { reportDate: new Date().toISOString() }
            }
          ],
          total: 1,
          page: 1,
          totalPages: 1
        };
      }

      const response = await apiClient.get(ROUTES.API.REPORTS, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get report by ID
  async getReportById(id) {
    try {
      const response = await apiClient.get(`${ROUTES.API.REPORTS}/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get dashboard statistics (Doctor/Admin only)
  async getDashboardStats() {
    try {
      const response = await apiClient.get(`${ROUTES.API.REPORTS}/dashboard`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get serious reports
  async getSeriousReports(params = {}) {
    try {
      const response = await apiClient.get(`${ROUTES.API.REPORTS}/serious`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get reports by medicine
  async getReportsByMedicine(medicineId, params = {}) {
    try {
      const response = await apiClient.get(`${ROUTES.API.REPORTS}/medicine/${medicineId}`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Submit new side effect report
  async submitReport(reportData) {
    try {
      // Check if we're in demo mode
      const token = localStorage.getItem('token');
      if (token && token.startsWith('demo-token')) {
        // Simulate successful submission for demo mode
        return {
          status: 'success',
          message: 'Report submitted successfully (Demo Mode)',
          data: {
            _id: `demo-report-${Date.now()}`,
            ...reportData,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        };
      }

      const response = await apiClient.post(ROUTES.API.REPORTS, reportData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update report status (Doctor/Admin only)
  async updateReportStatus(id, statusData) {
    try {
      const response = await apiClient.put(`${ROUTES.API.REPORTS}/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add follow-up information
  async addFollowUp(id, followUpData) {
    try {
      const response = await apiClient.post(`${ROUTES.API.REPORTS}/${id}/followup`, followUpData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update causality assessment (Doctor/Admin only)
  async updateCausalityAssessment(id, causalityData) {
    try {
      const response = await apiClient.put(`${ROUTES.API.REPORTS}/${id}/causality`, causalityData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // AI-powered report submission with multimodal input
  async submitAIReport(formData) {
    try {
      const response = await apiClient.post(`${ROUTES.API.REPORTS}/aisubmit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Preview AI-extracted report data
  async previewAIReport(formData) {
    try {
      const response = await apiClient.post(`${ROUTES.API.REPORTS}/aipreview`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Submit confirmed AI report
  async submitConfirmedAIReport(confirmData) {
    try {
      const response = await apiClient.post(`${ROUTES.API.REPORTS}/aiconfirm`, confirmData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper: Create FormData for AI submission
  createAIReportFormData({ text, images = [], audio, autoSubmit = false }) {
    const formData = new FormData();
    
    if (text) {
      formData.append('text', text);
    }
    
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        formData.append('images', image, image.name || `image_${index}`);
      });
    }
    
    if (audio) {
      formData.append('audio', audio, audio.name || 'audio_recording');
    }
    
    formData.append('autoSubmit', autoSubmit);
    
    return formData;
  }

  // Handle API errors
  handleError(error) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;
    const validationErrors = error.response?.data?.errors;
    const code = error.response?.data?.code;

    return {
      message,
      status,
      code,
      validationErrors,
      originalError: error
    };
  }
}

const reportServiceInstance = new ReportService();
export default reportServiceInstance;
