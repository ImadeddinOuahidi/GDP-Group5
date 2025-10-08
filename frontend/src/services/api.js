import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error responses
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // Sign in user
  signin: async (email, password) => {
    try {
      const response = await api.post('/auth/signin', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Sign up user
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Update profile picture
  updateProfilePicture: async (profilePicture) => {
    try {
      const response = await api.put('/auth/profile-picture', { profilePicture });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Deactivate account
  deactivateAccount: async (password) => {
    try {
      const response = await api.delete('/auth/deactivate', { data: { password } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },
};

// Medicine API endpoints
export const medicineAPI = {
  // Get all medicines
  getAllMedicines: async (params = {}) => {
    try {
      const response = await api.get('/medicines', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Search medicines
  searchMedicines: async (query) => {
    try {
      const response = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Get medicine by ID
  getMedicineById: async (id) => {
    try {
      const response = await api.get(`/medicines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Add new medicine (admin/doctor only)
  addMedicine: async (medicineData) => {
    try {
      const response = await api.post('/medicines', medicineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Update medicine (admin/doctor only)
  updateMedicine: async (id, medicineData) => {
    try {
      const response = await api.put(`/medicines/${id}`, medicineData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Delete medicine (admin only)
  deleteMedicine: async (id) => {
    try {
      const response = await api.delete(`/medicines/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },
};

// Reports API endpoints
export const reportAPI = {
  // Get all reports (filtered by user role)
  getAllReports: async (params = {}) => {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Get report by ID
  getReportById: async (id) => {
    try {
      const response = await api.get(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Create new report
  createReport: async (reportData) => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Update report
  updateReport: async (id, reportData) => {
    try {
      const response = await api.put(`/reports/${id}`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Delete report
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/reports/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Update report status (doctor/admin only)
  updateReportStatus: async (id, status) => {
    try {
      const response = await api.patch(`/reports/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },
};

// Symptom Progression API endpoints
export const symptomProgressionAPI = {
  // Get all symptom progressions for current user
  getAllProgressions: async (params = {}) => {
    try {
      const response = await api.get('/symptom-progression', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Get progression by ID
  getProgressionById: async (id) => {
    try {
      const response = await api.get(`/symptom-progression/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Create new symptom progression
  createProgression: async (progressionData) => {
    try {
      const response = await api.post('/symptom-progression', progressionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Update symptom progression
  updateProgression: async (id, progressionData) => {
    try {
      const response = await api.put(`/symptom-progression/${id}`, progressionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Delete symptom progression
  deleteProgression: async (id) => {
    try {
      const response = await api.delete(`/symptom-progression/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },

  // Get progression analytics
  getProgressionAnalytics: async (params = {}) => {
    try {
      const response = await api.get('/symptom-progression/analytics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Network error occurred' };
    }
  },
};

// Export default api instance for custom requests
export default api;