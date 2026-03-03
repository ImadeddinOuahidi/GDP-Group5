// API Configuration
export const API_CONFIG = {
  // Update this to your backend URL
  BASE_URL: __DEV__ 
    ? 'http://localhost:5001/api'  // Development
    : 'https://your-production-api.com/api', // Production
  
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Auth
    LOGIN: '/auth/signin',
    REGISTER: '/auth/signup',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    
    // Reports
    REPORTS: '/reports',
    AI_SUBMIT: '/reports/aisubmit',
    AI_CONFIRM: '/reports/aiconfirm',
    
    // Medications
    MEDICATIONS: '/medications',
    FUZZY_SEARCH: '/medications/fuzzy-search',
    SUGGESTIONS: '/medications/suggestions',
    
    // Symptom Progression
    SYMPTOM_PROGRESSION: '/symptom-progression',
    
    // Uploads
    UPLOADS: '/uploads',
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
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  CONFIRMED: 'confirmed',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};
