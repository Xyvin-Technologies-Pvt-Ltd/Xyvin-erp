const AppError = require('../utils/AppError');
const config = require('../config/config');

exports.handleError = (err, req, res, next) => {
  console.error('Error:', {
    timestamp: new Date().toISOString(),
    message: err.message,
    stack: err.stack,
    status: err.status,
    statusCode: err.statusCode
  });

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Mongoose duplicate key error
  // if (err.code === 11000) {
  //   err.statusCode = 400;
  //   err.message = 'Duplicate field value entered';
  // }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    err.message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    err.statusCode = 401;
    err.message = 'Invalid token. Please log in again!';
  }

  if (err.name === 'TokenExpiredError') {
    err.statusCode = 401;
    err.message = 'Your token has expired! Please log in again.';
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(config.env === 'development' && { 
      stack: err.stack,
      error: err 
    }),
  });
};

exports.handleNotFound = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
}; 