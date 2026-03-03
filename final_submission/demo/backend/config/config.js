/**
 * Application Configuration
 * Centralizes all environment variables and application settings
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_app',
    options: {
      maxPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // Email Configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'noreply@healthcare.com'
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'],
    uploadsDir: process.env.UPLOADS_DIR || './uploads',
    tempDir: process.env.TEMP_DIR || './temp'
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    authWindowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
  },

  // Security Configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    cookieMaxAge: parseInt(process.env.COOKIE_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logDir: process.env.LOG_DIR || './logs',
    enableConsole: process.env.ENABLE_CONSOLE_LOGS !== 'false',
    enableFile: process.env.ENABLE_FILE_LOGS !== 'false'
  },

  // Pagination Defaults
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100
  }
};

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
const validateConfig = () => {
  const requiredVars = [];

  // Check critical variables
  if (config.server.isProduction) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key') {
      requiredVars.push('JWT_SECRET (required in production)');
    }
    if (!process.env.MONGODB_URI) {
      requiredVars.push('MONGODB_URI (required in production)');
    }
  }

  if (requiredVars.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${requiredVars.join('\n')}`
    );
  }

  // Warn about optional but recommended variables
  const recommendedVars = [];
  if (!process.env.EMAIL_USER) {
    recommendedVars.push('EMAIL_USER (email features will not work)');
  }
  if (!process.env.OPENAI_API_KEY) {
    recommendedVars.push('OPENAI_API_KEY (AI features will not work)');
  }

  if (recommendedVars.length > 0 && config.server.isDevelopment) {
    console.warn(
      '\n⚠️  Warning: Missing recommended environment variables:\n' +
      recommendedVars.map(v => `   - ${v}`).join('\n')
    );
  }
};

// Validate configuration on load
validateConfig();

module.exports = config;
