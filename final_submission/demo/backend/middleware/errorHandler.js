/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

const config = require('../config/config');
const { AppError } = require('./errors');

/**
 * Handle MongoDB CastError (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

/**
 * Handle MongoDB duplicate key error
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new AppError(message, 409, 'DUPLICATE_FIELD');
};

/**
 * Handle MongoDB validation error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
    value: el.value
  }));

  const message = 'Invalid input data';
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  error.errors = errors;
  return error;
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

/**
 * Handle Multer file upload errors
 */
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File size too large', 400, 'FILE_TOO_LARGE');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400, 'UNEXPECTED_FILE');
  }
  return new AppError(err.message, 400, 'FILE_UPLOAD_ERROR');
};

/**
 * Send error response in development mode
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    errorCode: err.errorCode,
    message: err.message,
    errors: err.errors,
    stack: err.stack
  });
};

/**
 * Send error response in production mode
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      errorCode: err.errorCode,
      message: err.message,
      errors: err.errors
    });
  } 
  // Programming or unknown error: don't leak error details
  else {
    console.error('ERROR 💥:', err);
    res.status(500).json({
      success: false,
      status: 'error',
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong. Please try again later.'
    });
  }
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.server.isDevelopment) {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (error.name === 'MulterError') error = handleMulterError(error);

    sendErrorProd(error, res);
  }
};

/**
 * Handle unhandled routes (404)
 */
const notFound = (req, res, next) => {
  const err = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(err);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  catchAsync
};
