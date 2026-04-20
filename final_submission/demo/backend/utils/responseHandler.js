/**
 * API Response Utilities
 * Standardizes API responses across the application
 */

/**
 * Send a successful response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 */
const sendSuccess = (res, { 
  statusCode = 200, 
  message = 'Success', 
  data = null,
  meta = null
}) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
    ...(meta && { meta })
  };

  res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options with pagination
 */
const sendPaginatedResponse = (res, {
  statusCode = 200,
  message = 'Success',
  data,
  page,
  limit,
  total,
  additionalMeta = {}
}) => {
  const totalPages = Math.ceil(total / limit);
  
  const response = {
    success: true,
    message,
    data,
    meta: {
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        pageSize: parseInt(limit),
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      ...additionalMeta
    }
  };

  res.status(statusCode).json(response);
};

/**
 * Send a created resource response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 */
const sendCreated = (res, {
  message = 'Resource created successfully',
  data
}) => {
  sendSuccess(res, {
    statusCode: 201,
    message,
    data
  });
};

/**
 * Send a no content response
 * @param {Object} res - Express response object
 */
const sendNoContent = (res) => {
  res.status(204).send();
};

module.exports = {
  sendSuccess,
  sendPaginatedResponse,
  sendCreated,
  sendNoContent
};
