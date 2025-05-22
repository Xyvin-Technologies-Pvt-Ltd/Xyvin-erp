const Joi = require('joi');

// Position validation
exports.validatePosition = (data) => {
  const schema = Joi.object({
    title: Joi.string().required().trim(),
    code: Joi.string().required().trim(),
    department: Joi.string().required().hex().length(24),
    description: Joi.string().required(),
    responsibilities: Joi.array().items(Joi.string()).min(1).required(),
    requirements: Joi.array().items(Joi.string()).min(1).required(),
    salaryRange: Joi.object({
      min: Joi.number().required().min(0),
      max: Joi.number().required().greater(Joi.ref('min'))
    }).required(),
    isActive: Joi.boolean()
  });

  return schema.validate(data);
};

// Department validation
exports.validateDepartment = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    code: Joi.string().required().trim(),
    description: Joi.string().required(),
    manager: Joi.string().hex().length(24),
    isActive: Joi.boolean()
  });

  return schema.validate(data);
}; 