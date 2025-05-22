const Joi = require('joi');

const personalLoanSchema = Joi.object({
  purpose: Joi.string()
    .required()
    .min(10)
    .messages({
      'string.empty': 'Purpose is required',
      'string.min': 'Purpose must be at least 10 characters',
    }),
  status: Joi.string()
    .valid('Pending', 'Approved', 'Rejected', 'Under Review', 'Disbursed')
    .default('Pending')
    .messages({
      'any.only': 'Status must be one of: Pending, Approved, Rejected, Under Review, or Disbursed',
    }),
  amount: Joi.number()
    .required()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required',
    }),
  term: Joi.number()
    .required()
    .min(1)
    .max(60)
    .messages({
      'number.base': 'Term must be a number',
      'number.min': 'Term must be at least 1 month',
      'number.max': 'Term cannot exceed 60 months',
      'any.required': 'Term is required',
    }),
  interestRate: Joi.number()
    .required()
    .min(0)
    .max(30)
    .messages({
      'number.base': 'Interest rate must be a number',
      'number.min': 'Interest rate cannot be negative',
      'number.max': 'Interest rate cannot exceed 30%',
      'any.required': 'Interest rate is required',
    }),
  employmentType: Joi.string()
    .required()
    .valid('Full-time', 'Part-time', 'Contract')
    .messages({
      'string.empty': 'Employment type is required',
      'any.only': 'Employment type must be Full-time, Part-time, or Contract',
    }),
  monthlyIncome: Joi.number()
    .required()
    .positive()
    .messages({
      'number.base': 'Monthly income must be a number',
      'number.positive': 'Monthly income must be positive',
      'any.required': 'Monthly income is required',
    }),
  monthlyPayment: Joi.number()
    .positive()
    .messages({
      'number.base': 'Monthly payment must be a number',
      'number.positive': 'Monthly payment must be positive',
    }), // Optional, since frontend calculates it
  documents: Joi.array()
    .items(
      Joi.object({
        fileName: Joi.string(),
        fileUrl: Joi.string(),
      })
    )
    .optional(),
}).options({ abortEarly: false });

const validatePersonalLoan = (data) => {
  return personalLoanSchema.validate(data);
};

module.exports = { validatePersonalLoan };