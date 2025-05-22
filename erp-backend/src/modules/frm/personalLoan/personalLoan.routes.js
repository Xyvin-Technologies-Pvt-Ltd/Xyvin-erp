const express = require('express');
const router = express.Router();
const upload = require('../../../middleware/upload');
const {
  createPersonalLoan,
  getPersonalLoans,
  getPersonalLoanById,
  updatePersonalLoan,
  processLoanApplication,
  recordPayment,
  getLoanStats,
  deletePersonalLoan
} = require('./personalLoan.controller');
const { protect } = require('../../../middleware/authMiddleware');


router.use(protect)

// Create new personal loan application
router.post('/', 
  
  upload.array('documents'), 
  createPersonalLoan
);

// Get all personal loans (with filters)
router.get('/', 
 
  getPersonalLoans
);

// Get personal loan by ID
router.get('/:id', 
 
  getPersonalLoanById
);

// Update personal loan
router.put('/:id', 
 
  upload.array('documents'), 
  updatePersonalLoan
);

// Delete personal loan
router.delete('/:id',
  
  deletePersonalLoan
);

// Process loan application (approve/reject)
router.post('/:id/process', 
 
  processLoanApplication
);

// Record loan payment
router.post('/:id/payment', 

  recordPayment
);

// Get loan statistics
router.get('/stats/overview', 
 
  getLoanStats
);

module.exports = router; 