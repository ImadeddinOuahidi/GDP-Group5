/**
 * Security Middleware
 * Implements rate limiting, input sanitization, and security headers
 */

const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const config = require('../config/config');
const { AppError } = require('./errors');

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + ' minutes'
    });
  }
});

/**
 * Strict rate limiter for authentication routes
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMaxRequests,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
      errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimit.authWindowMs / 1000 / 60) + ' minutes'
    });
  }
});

/**
 * Configure Helmet security headers
 */
const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
};

/**
 * Sanitize MongoDB queries to prevent NoSQL injection
 */
const sanitizeData = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized request from ${req.ip}: removed ${key}`);
    }
  });
};

/**
 * Validate content type for specific routes
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // Allow multipart for file uploads
    if (contentType && contentType.includes('multipart/form-data')) {
      return next();
    }
    
    // Require JSON for other requests
    if (!contentType || !contentType.includes('application/json')) {
      return next(new AppError('Content-Type must be application/json', 400, 'INVALID_CONTENT_TYPE'));
    }
  }
  next();
};

/**
 * Request size limiter
 */
const requestSizeLimiter = (req, res, next) => {
  const contentLength = req.get('content-length');
  
  if (contentLength && parseInt(contentLength) > config.upload.maxFileSize) {
    return next(new AppError('Request entity too large', 413, 'REQUEST_TOO_LARGE'));
  }
  
  next();
};

module.exports = {
  generalLimiter,
  authLimiter,
  configureHelmet,
  sanitizeData,
  validateContentType,
  requestSizeLimiter
};
