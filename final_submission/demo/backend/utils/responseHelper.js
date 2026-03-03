/**
 * Response Helper Utilities
 * Standardized response formatting for API endpoints
 */

const { HTTP_STATUS } = require('./constants');

/**
 * Format successful response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @returns {Object} JSON response
 */
const sendSuccess = (res, options = {}) => {
  const {
    data = null,
    message = 'Success',
    statusCode = HTTP_STATUS.OK,
    meta = null
  } = options;

  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format error response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @returns {Object} JSON response
 */
const sendError = (res, options = {}) => {
  const {
    message = 'An error occurred',
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors = null,
    stack = null
  } = options;

  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  if (stack && process.env.NODE_ENV === 'development') {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format created response
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, {
    data,
    message,
    statusCode: HTTP_STATUS.CREATED
  });
};

/**
 * Format paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} JSON response
 */
const sendPaginated = (res, data, pagination = {}) => {
  const {
    page = 1,
    limit = 10,
    total = 0,
    totalPages = 0
  } = pagination;

  return sendSuccess(res, {
    data,
    meta: {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: parseInt(totalPages),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
};

/**
 * Format deleted response
 * @param {Object} res - Express response object
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
const sendDeleted = (res, message = 'Resource deleted successfully') => {
  return sendSuccess(res, {
    message,
    statusCode: HTTP_STATUS.OK
  });
};

/**
 * Format updated response
 * @param {Object} res - Express response object
 * @param {Object} data - Updated resource data
 * @param {String} message - Success message
 * @returns {Object} JSON response
 */
const sendUpdated = (res, data, message = 'Resource updated successfully') => {
  return sendSuccess(res, {
    data,
    message,
    statusCode: HTTP_STATUS.OK
  });
};

/**
 * Format no content response
 * @param {Object} res - Express response object
 * @returns {Object} Response with no content
 */
const sendNoContent = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Format validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @returns {Object} JSON response
 */
const sendValidationError = (res, errors) => {
  return sendError(res, {
    message: 'Validation failed',
    statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

/**
 * Format unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
const sendUnauthorized = (res, message = 'Authentication required') => {
  return sendError(res, {
    message,
    statusCode: HTTP_STATUS.UNAUTHORIZED
  });
};

/**
 * Format forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
const sendForbidden = (res, message = 'You do not have permission to perform this action') => {
  return sendError(res, {
    message,
    statusCode: HTTP_STATUS.FORBIDDEN
  });
};

/**
 * Format not found response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @returns {Object} JSON response
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, {
    message,
    statusCode: HTTP_STATUS.NOT_FOUND
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendPaginated,
  sendDeleted,
  sendUpdated,
  sendNoContent,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound
};
