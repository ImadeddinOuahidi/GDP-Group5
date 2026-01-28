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
  
  // Doctor Routes - Medication Management
  MEDICATIONS: '/medications',
  ADD_MEDICATION: '/add-medication',
  
  // Patient Routes
  REPORT: '/report',
  REPORTS: '/reports',
  
  // API Routes
  API: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
    },
    MEDICATIONS: '/medications', // Medication system for side effect reporting
    REPORTS: '/reports',
    SYMPTOMS: '/symptom-progression',
  }
};

// Report Status
export const REPORT_STATUS = [
  'Draft', 'Submitted', 'Under Review', 'Reviewed', 'Closed', 'Rejected'
];

// Report Priority Levels
export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

// Report Seriousness
export const SERIOUSNESS_LEVELS = ['Serious', 'Non-serious'];

// Side Effect Onset Times
export const ONSET_TIMES = [
  'Immediate', 'Within hours', 'Within days', 'Within weeks', 'Unknown'
];

// Body Systems
export const BODY_SYSTEMS = [
  'Gastrointestinal', 'Cardiovascular', 'Respiratory', 'Nervous System',
  'Musculoskeletal', 'Dermatological', 'Genitourinary', 'Endocrine',
  'Hematological', 'Psychiatric', 'Ocular', 'Otic', 'Other'
];

// Report Outcomes
export const REPORT_OUTCOMES = [
  'Recovered/Resolved', 'Recovering', 'Not recovered',
  'Recovered with sequelae', 'Fatal', 'Unknown'
];

// Causality Assessment Algorithms
export const CAUSALITY_ALGORITHMS = [
  'WHO-UMC', 'Naranjo', 'CIOMS/RUCAM', 'Other', 'Not assessed'
];

// Causality Categories
export const CAUSALITY_CATEGORIES = [
  'Certain', 'Probable', 'Possible', 'Unlikely',
  'Conditional', 'Unassessable', 'Unclassifiable'
];

// Follow-up Information Types
export const FOLLOWUP_TYPES = [
  'Additional information', 'Correction', 'Follow-up report'
];

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

// Medication Categories
export const MEDICATION_CATEGORIES = [
  'Analgesic', 'Antibiotic', 'Antiviral', 'Antifungal', 'Antihistamine',
  'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
  'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
  'Supplement', 'Other'
];

// Medication Dosage Forms
export const MEDICATION_DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Liquid/Syrup', 'Injection', 'Cream/Ointment',
  'Drops', 'Inhaler', 'Patch', 'Powder', 'Other'
];

// Dosage Forms (for reports)
export const DOSAGE_FORMS = [
  'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
  'Drops', 'Inhaler', 'Patch', 'Suppository', 'Powder', 'Gel'
];

// Routes of Administration
export const ADMINISTRATION_ROUTES = [
  'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical',
  'Inhalation', 'Rectal', 'Vaginal', 'Nasal', 'Ophthalmic', 'Otic'
];

// Strength Units
export const STRENGTH_UNITS = ['mg', 'g', 'mcg', 'ml', 'L', 'IU', '%'];

// Side Effect Severity Levels
export const SEVERITY_LEVELS = ['Mild', 'Moderate', 'Severe', 'Life-threatening'];