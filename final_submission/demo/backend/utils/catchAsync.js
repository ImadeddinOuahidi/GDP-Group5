/**
 * Async Handler Wrapper
 * Eliminates the need for try-catch blocks in async route handlers
 */

/**
 * Wraps async route handlers to catch errors and pass them to error middleware
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Multiple async handlers wrapper
 * @param {Array<Function>} handlers - Array of async handlers
 * @returns {Array<Function>} Wrapped handlers
 */
const catchAsyncAll = (handlers) => {
  return handlers.map(handler => catchAsync(handler));
};

module.exports = {
  catchAsync,
  catchAsyncAll
};
