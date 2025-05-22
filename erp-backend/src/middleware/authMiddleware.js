const jwt = require('jsonwebtoken');
const Employee = require('../modules/hrm/employee/employee.model');
const { JWT_SECRET } = require('../config/env');

exports.protect = async (req, res, next) => {
  try {
    console.log('Headers received:', req.headers);
    console.log('Authorization header:', req.headers.authorization);
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token);
    } else {
      console.log('No Bearer token found in Authorization header');
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      console.log('Attempting to verify token with secret');
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token successfully decoded:', decoded);

      // Get user from token
      console.log('Finding user with ID:', decoded.id);
      req.user = await Employee.findById(decoded.id).select('-password');
      console.log('User found:', req.user ? 'Yes' : 'No');

      if (!req.user) {
        console.log('No user found with token ID');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add role from token to user object
      req.user.role = decoded.role;
      console.log('User role from token:', req.user.role);
      console.log('Authorization successful');
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        expiredAt: error.expiredAt
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Protect middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        console.log('No role found for user');
        return res.status(403).json({
          success: false,
          message: 'User has no role assigned'
        });
      }

      console.log('User role:', req.user.role);
      console.log('Required roles:', roles);

      // Check if the user's role is included in the required roles
      const hasRequiredRole = roles.includes(req.user.role);

      if (!hasRequiredRole) {
        console.log('User does not have required role');
        return res.status(403).json({
          success: false,
          message: 'User does not have required role'
        });
      }

      console.log('Authorization successful');
      next();
    } catch (error) {
      console.error('Authorize middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

