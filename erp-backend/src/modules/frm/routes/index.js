const express = require('express');
const router = express.Router();
const expenseRoutes = require('../expense/expense.routes');
const personalLoanRoutes = require('../personalLoan/personalLoan.routes');
const officeLoanRoutes = require('../officeloan/officeLoan.routes');
const profitRoutes = require('../profit/profit.route');

// Mount routes
router.use('/expenses', expenseRoutes);
router.use('/personal-loans', personalLoanRoutes);
router.use('/office-loans', officeLoanRoutes);
router.use('/profits', profitRoutes);

module.exports = router; 