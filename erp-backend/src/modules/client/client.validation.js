const Joi = require('joi');

exports.validateClient = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email().trim().lowercase(),
    phone: Joi.string().trim(),
    company: Joi.string().trim(),
    address: Joi.object({
      street: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      country: Joi.string().allow(''),
      zipCode: Joi.string().allow('')
    }),
    status: Joi.string().valid('active', 'inactive')
  });

  return schema.validate(data);
}; 