const express = require('express');
const router = express.Router();
const profitController = require('../profit/profit.controller');
const { protect } = require('../../../middleware/authMiddleware');


router.use(protect)

// Get next profit number
router.get('/next-number', profitController.getNextProfitNumber);

// Create a new profit
router.post('/', profitController.createProfit);

// Get all profits
router.get('/', profitController.getProfits);

// Get profit by ID
router.get('/:id', profitController.getProfitById);

// Update profit
router.put('/:id', profitController.updateProfit);

// Delete profit
router.delete('/:id', profitController.deleteProfit);

module.exports = router;