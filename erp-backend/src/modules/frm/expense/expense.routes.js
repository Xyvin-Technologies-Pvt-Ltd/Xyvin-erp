const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  processExpense,
  getExpenseStats,
  getNextExpenseNumber
} = require('../expense/expense.controller');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect)

// Get next expense number
router.get('/next-number', getNextExpenseNumber);

// Get expense statistics
router.get('/stats', getExpenseStats);

// Get all expenses (with filters)
router.get('/', getExpenses);

// Create new expense
router.post('/', upload.array('documents'), createExpense);

// Get expense by ID
router.get('/:id', getExpenseById);

// Update expense
router.put('/:id', upload.array('documents'), updateExpense);

// Delete expense
router.delete('/:id', deleteExpense);

// Process expense (approve/reject) - requires admin or manager role
router.patch('/:id/process',  processExpense);

module.exports = router; 