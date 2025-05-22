const AppError = require('../utils/AppError');

// Development error response
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack
  });
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Handle Mongoose validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Mongoose duplicate key errors
// const handleDuplicateKeyError = (err) => {
//   const field = Object.keys(err.keyValue)[0];
//   const message = `Duplicate field value: ${field}. Please use another value`;
//   return new AppError(message, 400);
// };

// Handle JWT errors
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () => 
  new AppError('Your token has expired. Please log in again', 401);

const setupErrorHandlers = (app) => {
  // 404 handler
  app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
  });

  // Global error handler
  app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
      sendErrorDev(err, res);
    } else {
      let error = { ...err };
      error.message = err.message;

      // Handle specific errors
      if (err.name === 'ValidationError') error = handleValidationError(err);
      if (err.code === 11000) error = handleDuplicateKeyError(err);
      if (err.name === 'JsonWebTokenError') error = handleJWTError();
      if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

      sendErrorProd(error, res);
    }
  });
};

module.exports = { setupErrorHandlers }; 