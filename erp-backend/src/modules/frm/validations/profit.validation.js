const Joi = require('joi');

const createProfit = {
  body: Joi.object().keys({
    profitNumber: Joi.string().trim(),
    description: Joi.string().required().min(3).max(1000).trim(),
    amount: Joi.number().required().min(0),
    date: Joi.date(),
    category: Joi.string().valid('sales', 'services', 'investments', 'other').required(),
    notes: Joi.string().max(1000).trim().allow(''),
    status: Joi.string().valid('Pending', 'Realized', 'Cancelled'),
  }),
};

const getProfits = {
  query: Joi.object().keys({
    status: Joi.string().valid('Pending', 'Realized', 'Cancelled'),
    category: Joi.string().valid('sales', 'services', 'investments', 'other'),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }),
};

const getProfitById = {
  params: Joi.object().keys({
    profitId: Joi.string().required(),
  }),
};

const updateProfit = {
  params: Joi.object().keys({
    profitId: Joi.string().required(),
  }),
  body: Joi.object()
    .keys({
      profitNumber: Joi.string().trim(),
      description: Joi.string().min(3).max(1000).trim(),
      amount: Joi.number().min(0),
      date: Joi.date(),
      category: Joi.string().valid('sales', 'services', 'investments', 'other'),
      notes: Joi.string().max(1000).trim().allow(''),
      status: Joi.string().valid('Pending', 'Realized', 'Cancelled'),
    })
    .min(1), // Require at least one field to update
};

const deleteProfit = {
  params: Joi.object().keys({
    profitId: Joi.string().required(),
  }),
};

const verifyProfit = {
  params: Joi.object().keys({
    profitId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('Realized', 'Cancelled').required(),
  }),
};

const getProfitStats = {
  query: Joi.object().keys({}),
};

module.exports = {
  createProfit,
  getProfits,
  getProfitById,
  updateProfit,
  deleteProfit,
  verifyProfit,
  getProfitStats,
};