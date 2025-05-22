const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const {
  createOfficeLoan,
  getOfficeLoans,
  getOfficeLoanById,
  updateOfficeLoan,
  processLoanRequest,
  recordPayment,
  getLoanStats,
  deleteOfficeLoan
} = require('../officeloan/officeLoan.controller');
const { protect } = require('../../../middleware/authMiddleware');

router.use(protect)

// Get loan statistics by department
router.get('/stats/department', 
  getLoanStats
);

// Create new office loan request
router.post('/', 
  upload.array('documents'), 
  createOfficeLoan
);

// Get all office loans (with filters)
router.get('/', 
  getOfficeLoans
);

// Get office loan by ID
router.get('/:id', 
  getOfficeLoanById
);

// Update office loan request
router.put('/:id', 
  upload.array('documents'), 
  updateOfficeLoan
);

// Process loan request (approve/reject)
router.post('/:id/process', 
  processLoanRequest
);

// Record loan payment
router.post('/:id/payment', 
  recordPayment
);

// Delete office loan
router.delete('/:id',
  deleteOfficeLoan
);

module.exports = router; 