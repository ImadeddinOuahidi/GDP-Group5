/**
 * Custom Application Error Class
 * Extends the built-in Error class to provide additional functionality
 * for handling application-specific errors with HTTP status codes
 */

class AppError extends Error {
  /**
   * Create an application error
   * @param {String} message - Error message
   * @param {Number} statusCode - HTTP status code (default: 500)
   * @param {String} errorCode - Application-specific error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, errorCode = null, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Create a validation error (400)
   * @param {String} message - Error message
   * @param {Object} details - Validation details
   * @returns {AppError} New AppError instance
   */
  static validation(message, details = null) {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }
  
  /**
   * Create an authentication error (401)
   * @param {String} message - Error message
   * @returns {AppError} New AppError instance
   */
  static auth(message = 'Authentication required') {
    return new AppError(message, 401, 'AUTHENTICATION_ERROR');
  }
  
  /**
   * Create an authorization error (403)
   * @param {String} message - Error message
   * @returns {AppError} New AppError instance
   */
  static forbidden(message = 'Access forbidden') {
    return new AppError(message, 403, 'AUTHORIZATION_ERROR');
  }
  
  /**
   * Create a not found error (404)
   * @param {String} resource - Resource that was not found
   * @returns {AppError} New AppError instance
   */
  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
  
  /**
   * Create a conflict error (409)
   * @param {String} message - Error message
   * @returns {AppError} New AppError instance
   */
  static conflict(message) {
    return new AppError(message, 409, 'CONFLICT_ERROR');
  }
  
  /**
   * Create a rate limit error (429)
   * @param {String} message - Error message
   * @returns {AppError} New AppError instance
   */
  static rateLimit(message = 'Too many requests') {
    return new AppError(message, 429, 'RATE_LIMIT_ERROR');
  }
  
  /**
   * Create an internal server error (500)
   * @param {String} message - Error message
   * @param {Object} details - Error details
   * @returns {AppError} New AppError instance
   */
  static internal(message = 'Internal server error', details = null) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }
  
  /**
   * Create a service unavailable error (503)
   * @param {String} message - Error message
   * @returns {AppError} New AppError instance
   */
  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE');
  }
  
  /**
   * Create error from Mongoose validation error
   * @param {Error} err - Mongoose validation error
   * @returns {AppError} New AppError instance
   */
  static fromMongoose(err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return new AppError(
        `Validation failed: ${errors.join(', ')}`,
        400,
        'VALIDATION_ERROR',
        { fields: Object.keys(err.errors) }
      );
    }
    
    if (err.name === 'CastError') {
      return new AppError(
        `Invalid ${err.path}: ${err.value}`,
        400,
        'CAST_ERROR'
      );
    }
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return new AppError(
        `${field} already exists`,
        409,
        'DUPLICATE_ERROR',
        { field, value: err.keyValue[field] }
      );
    }
    
    return new AppError(err.message, 500, 'DATABASE_ERROR');
  }
  
  /**
   * Create error from JWT error
   * @param {Error} err - JWT error
   * @returns {AppError} New AppError instance
   */
  static fromJWT(err) {
    if (err.name === 'JsonWebTokenError') {
      return new AppError('Invalid token', 401, 'INVALID_TOKEN');
    }
    
    if (err.name === 'TokenExpiredError') {
      return new AppError('Token expired', 401, 'EXPIRED_TOKEN');
    }
    
    return new AppError('Authentication failed', 401, 'AUTH_ERROR');
  }
  
  /**
   * Convert error to JSON object
   * @returns {Object} Error object
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
      errorCode: this.errorCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

module.exports = AppError;