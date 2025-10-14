// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Authentication
export const TOKEN_KEY = 'authToken';
export const USER_KEY = 'userData';

// Theme
export const THEME_KEY = 'theme';

// Routes
export const ROUTES = {
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  
  // Dashboard Routes
  HOME: '/',
  DASHBOARD: '/dashboard',
  DOCTOR_HOME: '/doctor-home',
  SETTINGS: '/settings',
  
  // Patient Routes
  REPORT: '/report',
  
  // API Routes
  API: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    MEDICINES: '/medicines',
    REPORTS: '/reports',
    SYMPTOMS: '/symptom-progression',
  }
};

// User Roles
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

// Form Validation
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address'
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters long'
  },
  PHONE: {
    PATTERN: /^[0-9]{10}$/,
    MESSAGE: 'Please enter a valid 10-digit phone number'
  }
};

// Theme Mode
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};