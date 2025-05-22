const Joi = require('joi');

const createProfit = {
  body: Joi.object().keys({
    profitNumber: Joi.string().required().trim(),
    title: Joi.string().required().min(3).max(200).trim(),
    amount: Joi.number().required().min(0),
    date: Joi.date(),
    category: Joi.string().valid('sales', 'services', 'investments', 'other').required(),
    description: Joi.string().max(1000).trim().allow(''),
    source: Joi.string().required().trim(),
    status: Joi.string().valid('Pending', 'Verified', 'Rejected'),
  }),
};

const getProfits = {
  query: Joi.object().keys({
    status: Joi.string().valid('Pending', 'Verified', 'Rejected'),
    category: Joi.string().valid('sales', 'services', 'investments', 'other'),
    source: Joi.string(),
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
      title: Joi.string().min(3).max(200).trim(),
      amount: Joi.number().min(0),
      date: Joi.date(),
      category: Joi.string().valid('sales', 'services', 'investments', 'other'),
      description: Joi.string().max(1000).trim().allow(''),
      source: Joi.string().trim(),
      status: Joi.string().valid('Pending', 'Verified', 'Rejected'),
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
    status: Joi.string().valid('Verified', 'Rejected').required(),
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