const Joi = require('joi');

const expenseSchema = Joi.object({
  expenseNumber: Joi.string()
    .pattern(/^EXP\d{3}$/)
    .messages({
      'string.pattern.base': 'Invalid expense number format'
    })
    .optional(),

  description: Joi.string()
    .required()
    .min(3)
    .max(200)
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 3 characters long',
      'string.max': 'Description cannot exceed 200 characters'
    }),

  amount: Joi.alternatives().try(
    Joi.number().required().positive(),
    Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required()
  ).messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'string.pattern.base': 'Amount must be a valid number with up to 2 decimal places',
    'any.required': 'Amount is required'
  }),

  date: Joi.date()
    .required()
    .messages({
      'date.base': 'Date must be a valid date',
      'any.required': 'Date is required'
    }),

  category: Joi.string()
    .required()
    .valid('travel', 'office', 'meals', 'utilities', 'other')
    .messages({
      'any.only': 'Category must be one of: travel, office, meals, utilities, other',
      'any.required': 'Category is required'
    }),

  notes: Joi.string()
    .allow('')
    .max(1000)
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    }),

  status: Joi.string()
    .valid('Pending', 'Approved', 'Rejected')
    .default('Pending')
    .messages({
      'any.only': 'Status must be Pending, Approved, or Rejected'
    }),

  documents: Joi.array().items(
    Joi.object({
      fileName: Joi.string().required(),
      fileUrl: Joi.string().required().uri()
    })
  ).default([])
});

const validateExpense = (data) => {
  return expenseSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateExpense
}; 