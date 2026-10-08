const apiError = (status, message, code = status, field) => Object.assign(new Error(message), { status, code, field });
const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500);
  if (status >= 500) console.error(error);
  return res.status(status).json({
    error: error.code || status,
    message: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
    data: error.field ? { field: error.field } : {}
  });
};
module.exports = { apiError, errorHandler };
