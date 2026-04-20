// API Configuration
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (!__DEV__) return 'https://your-production-api.com/api';
  // Auto-detect dev machine IP from Expo dev server
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0];
    return `http://${host}:5001/api`;
  }
  return 'http://localhost:5001/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 30000,
  
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/signin',
    REGISTER: '/auth/signup',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    PROFILE_PICTURE: '/auth/profile-picture',
    
    // Reports
    REPORTS: '/reports',
    PENDING_REVIEWS: '/reports/pending-reviews',
    AI_SUBMIT: '/reports/aisubmit',
    AI_PREVIEW: '/reports/aipreview',
    AI_CONFIRM: '/reports/aiconfirm',
    
    // Medications
    MEDICATIONS: '/medications',
    MEDICATION_SEARCH: '/medications/search',
    MEDICATION_PATIENT: '/medications/patient',
    MEDICATION_POPULAR: '/medications/popular',
    MEDICATION_CATEGORIES: '/medications/categories',
    
    // Symptom Progression
    SYMPTOM_PROGRESSION: '/symptom-progression',
    
    // Uploads
    UPLOADS: '/uploads',
    
    // Notifications
    NOTIFICATIONS: '/notifications',
  },
};

// App Constants
export const APP_CONFIG = {
  APP_NAME: 'SafeMed',
  VERSION: '1.0.0',
  
  // Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'token',
    USER: 'user',
    SETTINGS: 'settings',
    THEME: 'theme',
  },
};

// Medication Categories
export const MEDICATION_CATEGORIES = [
  'Analgesic',
  'Antibiotic',
  'Antiviral',
  'Antifungal',
  'Antihistamine',
  'Cardiovascular',
  'Diabetes',
  'Respiratory',
  'Gastrointestinal',
  'Neurological',
  'Psychiatric',
  'Dermatological',
  'Hormonal',
  'Supplement',
  'Other',
];

// Dosage Forms
export const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Liquid/Syrup',
  'Injection',
  'Cream/Ointment',
  'Drops',
  'Inhaler',
  'Patch',
  'Powder',
  'Other',
];

// Severity Levels
export const SEVERITY_LEVELS = [
  { value: 'Mild', label: 'Mild', color: '#4CAF50' },
  { value: 'Moderate', label: 'Moderate', color: '#FFC107' },
  { value: 'Severe', label: 'Severe', color: '#FF9800' },
  { value: 'Life-threatening', label: 'Life-threatening', color: '#F44336' },
];

// Onset Times
export const ONSET_TIMES = [
  'Immediate',
  'Within hours',
  'Within days',
  'Within weeks',
  'Unknown',
];

// Body Systems
export const BODY_SYSTEMS = [
  'Gastrointestinal',
  'Cardiovascular',
  'Respiratory',
  'Nervous System',
  'Musculoskeletal',
  'Dermatological',
  'Genitourinary',
  'Endocrine',
  'Hematological',
  'Psychiatric',
  'Ocular',
  'Otic',
  'Other',
];

// Routes of Administration
export const ADMINISTRATION_ROUTES = [
  'Oral',
  'Intravenous',
  'Intramuscular',
  'Subcutaneous',
  'Topical',
  'Inhalation',
  'Rectal',
  'Vaginal',
  'Nasal',
  'Ophthalmic',
  'Otic',
];

// Report Status
export const REPORT_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  REVIEWED: 'Reviewed',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
};
