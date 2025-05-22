const Joi = require('joi');
const { createError } = require('../../utils/errors');

/**
 * Validate login request
 */
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required',
        'string.empty': 'Password cannot be empty'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map(detail => detail.message).join(', ');
    return next(createError(400, message));
  }

  next();
};

/**
 * Validate registration request
 */
exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string()
      .required()
      .min(2)
      .max(50)
      .messages({
        'any.required': 'First name is required',
        'string.empty': 'First name cannot be empty',
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters'
      }),
    lastName: Joi.string()
      .required()
      .min(1)
      .max(50)
      .messages({
        'any.required': 'Last name is required',
        'string.empty': 'Last name cannot be empty',
        'string.min': 'Last name must be at least 1 character long',
        'string.max': 'Last name cannot exceed 50 characters'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
        'string.empty': 'Email cannot be empty'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
        'string.empty': 'Password cannot be empty'
      }),
    employeeId: Joi.string()
      .required()
      .messages({
        'any.required': 'Employee ID is required',
        'string.empty': 'Employee ID cannot be empty'
      }),
    department: Joi.string()
      .required()
      .messages({
        'any.required': 'Department is required',
        'string.empty': 'Department cannot be empty'
      }),
    position: Joi.string()
      .required()
      .messages({
        'any.required': 'Position is required',
        'string.empty': 'Position cannot be empty'
      }),
    phone: Joi.string()
      .required()
      .messages({
        'any.required': 'Phone number is required',
        'string.empty': 'Phone number cannot be empty'
      }),
    joiningDate: Joi.date()
      .default(Date.now),
    salary: Joi.number()
      .required()
      .min(0)
      .messages({
        'any.required': 'Salary is required',
        'number.min': 'Salary cannot be negative'
      }),
    roles: Joi.array()
      .items(Joi.string())
      .messages({
        'array.base': 'Roles must be an array'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map(detail => detail.message).join(', ');
    return next(createError(400, message));
  }

  next();
};

/**
 * Validate password update request
 */
exports.validatePasswordUpdate = (req, res, next) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required',
        'string.empty': 'Current password cannot be empty'
      }),
    newPassword: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'any.required': 'New password is required',
        'string.empty': 'New password cannot be empty'
      })
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const message = error.details.map(detail => detail.message).join(', ');
    return next(createError(400, message));
  }

  next();
}; 