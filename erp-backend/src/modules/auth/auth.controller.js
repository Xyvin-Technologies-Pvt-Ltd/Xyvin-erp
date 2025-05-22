const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Employee = require('../hrm/employee/employee.model');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');
const { logger } = require('../../middleware/logger');
const crypto = require('crypto');

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    console.log('Password received:', password);

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user and explicitly select the password field
    const employee = await Employee.findOne({ email }).select('+password');
    console.log('Employee found:', employee ? 'Yes' : 'No');
    
    // Log full employee object for debugging
    if (employee) {
      console.log('Full employee details:', JSON.stringify(employee.toObject(), null, 2));
    } else {
      console.log('No employee found with email:', email);
    }

    if (!employee) {
      logger.warn(`Login attempt with invalid email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if employee is active
    if (employee.status !== 'active') {
      logger.warn(`Login attempt by inactive employee: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact administrator.'
      });
    }

    // Check if password matches
    console.log('Attempting to match password...');
    if (!employee.password) {
      console.error('No password found for employee');
      return res.status(500).json({
        success: false,
        message: 'Account configuration error'
      });
    }

    const isMatch = await employee.matchPassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      logger.warn(`Login attempt with invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token payload
    const tokenPayload = {
      id: employee._id,
      role: employee.role
    };
    console.log('Creating token with payload:', tokenPayload);

    // Create token
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    // Verify the token immediately to ensure it's valid
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified successfully:', decoded);
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new Error('Failed to generate valid token');
    }

    console.log('Generated token:', token);

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        profilePicture: employee.profilePicture,
        role: employee.role,
        department: employee.department,
        position: employee.position
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    logger.error(`Error in login: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Register new employee
 * @route   POST /api/v1/auth/register
 * @access  Private (Admin only)
 */
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department,
      position,
      phone,
      joiningDate,
      salary,
      role
    } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({
      $or: [{ email }, { employeeId }]
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email or ID already exists'
      });
    }

    // Create employee with default role if not provided
    const employee = await Employee.create({
      firstName,
      lastName,
      email,
      password,
      employeeId,
      department,
      position,
      phone,
      joiningDate: joiningDate || new Date(),
      salary,
      role: role || 'Employee',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      data: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    logger.error(`Error in register: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .populate('department', 'name')
      .populate('position', 'name');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        fullName: employee.fullName,
        email: employee.email,
        profilePicture: employee.profilePicture,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        joiningDate: employee.joiningDate,
        status: employee.status,
        role: employee.role
      }
    });
  } catch (error) {
    logger.error(`Error in getMe: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    // Check current password
    const employee = await Employee.findById(req.user.id).select('+password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const isMatch = await employee.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    employee.password = newPassword;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error(`Error in updatePassword: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    const employee = await Employee.findOne({ email });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'No employee found with that email'
      });
    }

    // Generate reset token (would typically send via email)
    const resetToken = generateResetToken();

    // Store hashed token in database with expiry
    employee.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    employee.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await employee.save({ validateBeforeSave: false });

    // In a real application, you would send an email with the reset link
    // For this example, we'll just return the token in the response
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken // In production, don't return this directly
    });
  } catch (error) {
    logger.error(`Error in forgotPassword: ${error.message}`, { stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Successfully logged out'
  });
};

// Helper function to generate JWT token
const generateToken = async (id) => {
  try {
    // Get employee with role information
    const employee = await Employee.findById(id);

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Create token with simple role string
    return jwt.sign(
      { 
        id,
        role: employee.role // Using the simple role string
      }, 
      JWT_SECRET, 
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// Helper function to generate reset token
const generateResetToken = () => {
  // Generate random bytes
  const resetToken = crypto.randomBytes(20).toString('hex');
  return resetToken;
};
