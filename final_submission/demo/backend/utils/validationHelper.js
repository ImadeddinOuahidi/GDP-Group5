/**
 * Validation Helper Utilities
 * Common validation functions for request data
 */

const { VALIDATION_PATTERNS } = require('./constants');
const AppError = require('./appError');

/**
 * Validate MongoDB ObjectId
 * @param {String} id - ID to validate
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If ID is invalid
 */
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id || !VALIDATION_PATTERNS.MONGO_ID.test(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
  return true;
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @throws {AppError} If email is invalid
 */
const validateEmail = (email) => {
  if (!email || !VALIDATION_PATTERNS.EMAIL.test(email)) {
    throw new AppError('Invalid email format', 400);
  }
  return true;
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @throws {AppError} If password is weak
 */
const validatePassword = (password) => {
  if (!password || !VALIDATION_PATTERNS.PASSWORD.test(password)) {
    throw new AppError(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      400
    );
  }
  return true;
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array<String>} requiredFields - Array of required field names
 * @throws {AppError} If any required field is missing
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!data[field] && data[field] !== 0 && data[field] !== false) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new AppError(
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
  }
  
  return true;
};

/**
 * Validate enum value
 * @param {*} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If value is not in allowed values
 */
const validateEnum = (value, allowedValues, fieldName = 'Value') => {
  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      400
    );
  }
  return true;
};

/**
 * Validate number range
 * @param {Number} value - Value to validate
 * @param {Number} min - Minimum value (inclusive)
 * @param {Number} max - Maximum value (inclusive)
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If value is out of range
 */
const validateNumberRange = (value, min, max, fieldName = 'Value') => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    throw new AppError(`${fieldName} must be a number`, 400);
  }
  
  if (num < min || num > max) {
    throw new AppError(
      `${fieldName} must be between ${min} and ${max}`,
      400
    );
  }
  
  return true;
};

/**
 * Validate string length
 * @param {String} value - Value to validate
 * @param {Number} min - Minimum length
 * @param {Number} max - Maximum length
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If string length is invalid
 */
const validateStringLength = (value, min, max, fieldName = 'Value') => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} must be a string`, 400);
  }
  
  if (value.length < min || value.length > max) {
    throw new AppError(
      `${fieldName} must be between ${min} and ${max} characters`,
      400
    );
  }
  
  return true;
};

/**
 * Validate date format and range
 * @param {String|Date} date - Date to validate
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If date is invalid
 */
const validateDate = (date, fieldName = 'Date') => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
  
  return true;
};

/**
 * Validate date is in the past
 * @param {String|Date} date - Date to validate
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If date is not in the past
 */
const validatePastDate = (date, fieldName = 'Date') => {
  validateDate(date, fieldName);
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (dateObj > now) {
    throw new AppError(`${fieldName} must be in the past`, 400);
  }
  
  return true;
};

/**
 * Validate date is in the future
 * @param {String|Date} date - Date to validate
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If date is not in the future
 */
const validateFutureDate = (date, fieldName = 'Date') => {
  validateDate(date, fieldName);
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (dateObj < now) {
    throw new AppError(`${fieldName} must be in the future`, 400);
  }
  
  return true;
};

/**
 * Validate URL format
 * @param {String} url - URL to validate
 * @param {String} fieldName - Name of the field for error message
 * @throws {AppError} If URL is invalid
 */
const validateUrl = (url, fieldName = 'URL') => {
  if (!url || !VALIDATION_PATTERNS.URL.test(url)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
  return true;
};

/**
 * Sanitize string input (remove HTML tags and trim)
 * @param {String} str - String to sanitize
 * @returns {String} Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate pagination parameters
 * @param {Object} query - Query object with page and limit
 * @returns {Object} Validated pagination parameters
 */
const validatePagination = (query) => {
  const { PAGINATION } = require('./constants');
  
  let page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT;
  
  // Ensure positive values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, PAGINATION.MAX_LIMIT));
  
  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

module.exports = {
  validateObjectId,
  validateEmail,
  validatePassword,
  validateRequiredFields,
  validateEnum,
  validateNumberRange,
  validateStringLength,
  validateDate,
  validatePastDate,
  validateFutureDate,
  validateUrl,
  sanitizeString,
  validatePagination
};
