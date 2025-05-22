const Joi = require('joi');

exports.validateProject = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    description: Joi.string().allow('').trim(),
    client: Joi.string().required().hex().length(24),
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).allow(null),
    status: Joi.string().valid('planning', 'in-progress', 'on-hold', 'completed', 'cancelled'),
    budget: Joi.number().min(0).allow(null),
    team: Joi.array().items(Joi.string().hex().length(24))
  });

  return schema.validate(data);
}; 