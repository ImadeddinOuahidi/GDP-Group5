import axios from 'axios';

// Base API URL - adjust based on your backend configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
export const tokenManager = {
  getToken: () => localStorage.getItem('authToken'),
  setToken: (token) => localStorage.setItem('authToken', token),
  removeToken: () => localStorage.removeItem('authToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token) => localStorage.setItem('refreshToken', token),
  removeRefreshToken: () => localStorage.removeItem('refreshToken'),
  clearAll: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('userProfile');
  }
};

// User data management
export const userManager = {
  getUser: () => {
    try {
      const userProfile = localStorage.getItem('userProfile');
      return userProfile ? JSON.parse(userProfile) : null;
    } catch (error) {
      console.error('Error parsing user profile:', error);
      return null;
    }
  },
  setUser: (user) => {
    localStorage.setItem('userProfile', JSON.stringify(user));
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('username', user.email);
  },
  removeUser: () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
  }
};

// Request interceptor to add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
      duration: `${duration}ms`,
      data: response.data
    });

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Calculate request duration for failed requests
    if (originalRequest.metadata) {
      const duration = new Date() - originalRequest.metadata.startTime;
      console.log(`❌ API Error: ${error.response?.status || 'Network Error'} ${originalRequest.url}`, {
        duration: `${duration}ms`,
        error: error.response?.data || error.message
      });
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear tokens and redirect to login
      tokenManager.clearAll();
      userManager.removeUser();
      
      // Emit a custom event to notify the app about authentication failure
      window.dispatchEvent(new CustomEvent('auth:logout', { 
        detail: { reason: 'token_expired' } 
      }));

      return Promise.reject(error);
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      error.message = 'Request timeout. Please check your connection and try again.';
    } else if (error.message === 'Network Error') {
      error.message = 'Unable to connect to the server. Please check your internet connection.';
    }

    // Handle other common HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.message = data.message || 'Bad request. Please check your input.';
          break;
        case 403:
          error.message = data.message || 'You do not have permission to perform this action.';
          break;
        case 404:
          error.message = data.message || 'The requested resource was not found.';
          break;
        case 500:
          error.message = data.message || 'Internal server error. Please try again later.';
          break;
        default:
          error.message = data.message || `Request failed with status ${status}.`;
      }
    }

    return Promise.reject(error);
  }
);

// API methods for different endpoints
export const api = {
  // Authentication endpoints
  auth: {
    signup: (userData) => apiClient.post('/auth/signup', userData),
    signin: (credentials) => apiClient.post('/auth/signin', credentials),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
    changePassword: (passwordData) => apiClient.put('/auth/change-password', passwordData),
    verifyEmail: (token) => apiClient.get(`/auth/verify-email?token=${token}`),
    resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
    deactivateAccount: (password) => apiClient.delete('/auth/deactivate', { data: { password } })
  },

  // Medicine endpoints
  medicines: {
    getAll: (params) => apiClient.get('/medicines', { params }),
    getById: (id) => apiClient.get(`/medicines/${id}`),
    create: (medicineData) => apiClient.post('/medicines', medicineData),
    update: (id, medicineData) => apiClient.put(`/medicines/${id}`, medicineData),
    delete: (id) => apiClient.delete(`/medicines/${id}`),
    search: (query) => apiClient.get(`/medicines/search?q=${encodeURIComponent(query)}`)
  },

  // Reports endpoints
  reports: {
    getAll: (params) => apiClient.get('/reports', { params }),
    getById: (id) => apiClient.get(`/reports/${id}`),
    create: (reportData) => apiClient.post('/reports', reportData),
    update: (id, reportData) => apiClient.put(`/reports/${id}`, reportData),
    delete: (id) => apiClient.delete(`/reports/${id}`),
    getByPatient: (patientId, params) => apiClient.get(`/reports/patient/${patientId}`, { params }),
    getByDoctor: (doctorId, params) => apiClient.get(`/reports/doctor/${doctorId}`, { params })
  },

  // Symptom progression endpoints
  symptomProgression: {
    getAll: (params) => apiClient.get('/symptom-progression', { params }),
    getById: (id) => apiClient.get(`/symptom-progression/${id}`),
    create: (progressionData) => apiClient.post('/symptom-progression', progressionData),
    update: (id, progressionData) => apiClient.put(`/symptom-progression/${id}`, progressionData),
    delete: (id) => apiClient.delete(`/symptom-progression/${id}`),
    getByPatient: (patientId, params) => apiClient.get(`/symptom-progression/patient/${patientId}`, { params })
  },

  // Utility endpoints
  health: () => apiClient.get('/health'),
  info: () => apiClient.get('/info')
};

// Export the axios instance for direct use if needed
export default apiClient;