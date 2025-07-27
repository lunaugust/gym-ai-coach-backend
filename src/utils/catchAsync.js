/**
 * A higher-order function to wrap async route handlers and catch errors.
 * @param {Function} fn - The async function to execute.
 * @returns {Function} An Express route handler function.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;