/**
 * Application Constants
 * Centralized configuration for magic numbers, strings, and enums
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// File Upload Limits
const FILE_LIMITS = {
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_COUNT: 10,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  },
  VIDEO: {
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_COUNT: 5,
    ALLOWED_TYPES: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv']
  },
  AUDIO: {
    MAX_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_COUNT: 1,
    ALLOWED_TYPES: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm', 'audio/aac']
  },
  DOCUMENT: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_COUNT: 10,
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  GENERAL: {
    MAX_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_COUNT: 10
  }
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  PHARMACIST: 'pharmacist'
};

// Report Status
const REPORT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  REVIEWED: 'reviewed',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  ARCHIVED: 'archived'
};

// Report Severity Levels
const SEVERITY_LEVELS = {
  MILD: 'mild',
  MODERATE: 'moderate',
  SEVERE: 'severe',
  LIFE_THREATENING: 'life-threatening'
};

// Priority Levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Medicine Categories
const MEDICINE_CATEGORIES = {
  PAINKILLER: 'Painkiller',
  ANTIBIOTIC: 'Antibiotic',
  ANTIVIRAL: 'Antiviral',
  ANTIFUNGAL: 'Antifungal',
  ANTIHISTAMINE: 'Antihistamine',
  ANTIDEPRESSANT: 'Antidepressant',
  ANTIDIABETIC: 'Antidiabetic',
  ANTIHYPERTENSIVE: 'Antihypertensive',
  CARDIOVASCULAR: 'Cardiovascular',
  GASTROINTESTINAL: 'Gastrointestinal',
  RESPIRATORY: 'Respiratory',
  DERMATOLOGICAL: 'Dermatological',
  HORMONAL: 'Hormonal',
  VITAMIN: 'Vitamin',
  SUPPLEMENT: 'Supplement',
  OTHER: 'Other'
};

// Medicine Forms
const MEDICINE_FORMS = {
  TABLET: 'Tablet',
  CAPSULE: 'Capsule',
  SYRUP: 'Syrup',
  INJECTION: 'Injection',
  CREAM: 'Cream',
  OINTMENT: 'Ointment',
  DROPS: 'Drops',
  INHALER: 'Inhaler',
  PATCH: 'Patch',
  POWDER: 'Powder',
  SOLUTION: 'Solution',
  SUSPENSION: 'Suspension'
};

// AI Analysis Model
const AI_MODELS = {
  GPT4_TURBO: 'gpt-4-turbo-preview',
  GPT4_VISION: 'gpt-4-vision-preview',
  WHISPER: 'whisper-1'
};

// Time Constants (in milliseconds)
const TIME = {
  ONE_SECOND: 1000,
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_SORT: '-createdAt'
};

// Cache TTL (Time To Live)
const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60 // 24 hours
};

// Validation Patterns
const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  MONGO_ID: /^[0-9a-fA-F]{24}$/,
  URL: /^https?:\/\/.+/
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  USER_EXISTS: 'User already exists',
  EMAIL_EXISTS: 'Email already registered',
  WEAK_PASSWORD: 'Password does not meet security requirements',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed',
  INVALID_FILE_TYPE: 'Invalid file type',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later'
};

// Success Messages
const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTERED: 'Registration successful',
  EMAIL_SENT: 'Email sent successfully',
  PASSWORD_RESET: 'Password reset successful',
  UPLOAD_SUCCESS: 'File uploaded successfully'
};

// S3 Folders
const S3_FOLDERS = {
  UPLOADS: 'uploads',
  IMAGES: 'uploads/images',
  VIDEOS: 'uploads/videos',
  AUDIO: 'uploads/audio',
  DOCUMENTS: 'uploads/documents',
  TEMP: 'temp',
  BACKUPS: 'backups'
};

// Retry Configuration
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 10000, // 10 seconds
  BACKOFF_MULTIPLIER: 2
};

// Rate Limiting
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  API: {
    WINDOW_MS: 1 * 60 * 1000, // 1 minute
    MAX_REQUESTS: 60
  }
};

// Log Levels
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  HTTP: 'http',
  DEBUG: 'debug'
};

// Database Collection Names
const COLLECTIONS = {
  USERS: 'users',
  MEDICINES: 'medicines',
  REPORTS: 'reportsideeffects',
  SYMPTOM_PROGRESSION: 'symptomprogressions',
  FILES: 'files'
};

module.exports = {
  HTTP_STATUS,
  FILE_LIMITS,
  USER_ROLES,
  REPORT_STATUS,
  SEVERITY_LEVELS,
  PRIORITY_LEVELS,
  MEDICINE_CATEGORIES,
  MEDICINE_FORMS,
  AI_MODELS,
  TIME,
  PAGINATION,
  CACHE_TTL,
  VALIDATION_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  S3_FOLDERS,
  RETRY_CONFIG,
  RATE_LIMITS,
  LOG_LEVELS,
  COLLECTIONS
};
