const Joi = require('joi');

const officeLoanSchema = Joi.object({
  purpose: Joi.string()
    .required()
    .min(10)
    .messages({
      'string.empty': 'Purpose is required',
      'string.min': 'Purpose must be at least 10 characters',
    }),
  amount: Joi.number()
    .required()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required',
    }),
  department: Joi.string()
    .required()
    .messages({
      'string.empty': 'Department is required',
    }),
  justification: Joi.string()
    .required()
    .min(10)
    .messages({
      'string.empty': 'Justification is required',
      'string.min': 'Justification must be at least 10 characters',
    }),
  repaymentPlan: Joi.object({
    installments: Joi.number()
      .required()
      .min(1)
      .max(60)
      .messages({
        'number.base': 'Number of installments must be a number',
        'number.min': 'Must have at least 1 installment',
        'number.max': 'Cannot exceed 60 installments',
      }),
    frequency: Joi.string()
      .required()
      .valid('Monthly', 'Quarterly', 'Annually')
      .messages({
        'string.empty': 'Payment frequency is required',
        'any.only': 'Frequency must be Monthly, Quarterly, or Annually',
      }),
    startDate: Joi.date()
      .required()
      .messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required',
      })
  }).required(),
  documents: Joi.array().items(
    Joi.object({
      fileName: Joi.string(),
      fileUrl: Joi.string()
    })
  ).optional()
});

const validateOfficeLoan = (data) => {
  return officeLoanSchema.validate(data, { abortEarly: false });
};

module.exports = { validateOfficeLoan };