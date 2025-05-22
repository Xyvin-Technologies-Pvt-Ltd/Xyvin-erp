const PersonalLoan = require('./personalLoan.model');
const { validatePersonalLoan } = require('../validations/personalLoanValidation');
const { uploadFile } = require('../../../utils/fileUpload');
const { createError } = require('../../../utils/errors');
// Create new personal loan application
const createPersonalLoan = async (req, res) => {
  try {
    let loanData;
    let documents = [];

    if (req.is('multipart/form-data')) {
      loanData = JSON.parse(req.body.data);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileUrl = await uploadFile(file);
          documents.push({
            fileName: file.originalname,
            fileUrl: fileUrl,
          });
        }
      }
    } else {
      loanData = req.body;
    }

    // Convert numeric fields
    if (loanData.amount) loanData.amount = parseFloat(loanData.amount);
    if (loanData.monthlyIncome) loanData.monthlyIncome = parseFloat(loanData.monthlyIncome);
    if (loanData.monthlyPayment) loanData.monthlyPayment = parseFloat(loanData.monthlyPayment);
    if (loanData.term) loanData.term = parseFloat(loanData.term);
    if (loanData.interestRate) loanData.interestRate = parseFloat(loanData.interestRate);

    // Validate request body
    const { error } = validatePersonalLoan(loanData);
    if (error) {
      throw createError(400, error.details[0].message);       
    }

    const loan = new PersonalLoan({
      ...loanData,
      documents,
      applicant: req.user._id,
      status: 'Pending',
    });

    await loan.save();

    res.status(201).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    console.error('Error creating personal loan:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      status: 'error',
      message
    });
  }
};

// Get all personal loans (with filters)
const getPersonalLoans = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    // Add filters if provided
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const loans = await PersonalLoan.find(filter)
      .populate('applicant', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(loans);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Get personal loan by ID
const getPersonalLoanById = async (req, res) => {
  try {
    const loan = await PersonalLoan.findById(req.params.id)
      .populate('applicant', 'name email')
      .populate('approvedBy', 'name email');

    if (!loan) throw createError(404, 'Personal loan not found');

    res.json(loan);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Update personal loan
const updatePersonalLoan = async (req, res) => {
  try {
    const loan = await PersonalLoan.findById(req.params.id);
    if (!loan) throw createError(404, 'Personal loan not found');

    let loanData;
    let documents = [...loan.documents];

    // Handle multipart form data with files
    if (req.is('multipart/form-data')) {
      loanData = JSON.parse(req.body.data);
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const fileUrl = await uploadFile(file);
          documents.push({
            fileName: file.originalname,
            fileUrl: fileUrl
          });
        }
      }
    } else {
      loanData = req.body;
    }

    // Convert numeric fields
    if (loanData.amount) loanData.amount = parseFloat(loanData.amount);
    if (loanData.monthlyIncome) loanData.monthlyIncome = parseFloat(loanData.monthlyIncome);
    if (loanData.monthlyPayment) loanData.monthlyPayment = parseFloat(loanData.monthlyPayment);

    // Validate request body
    const { error } = validatePersonalLoan(loanData);
    if (error) throw createError(400, error.details[0].message);

    // Update loan with new data and documents
    Object.assign(loan, { ...loanData, documents });
    await loan.save();

    res.json(loan);
  } catch (error) {
    console.error('Error updating personal loan:', error);
    throw createError(error.statusCode || 500, error.message);
  }
};

// Process loan application (approve/reject)
const processLoanApplication = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      throw createError(400, 'Invalid status');
    }

    const loan = await PersonalLoan.findById(req.params.id);
    if (!loan) throw createError(404, 'Personal loan not found');

    loan.status = status;
    loan.approvedBy = req.user._id;
    loan.approvalDate = new Date();

    if (status === 'Approved') {
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);
    }

    await loan.save();
    res.json(loan);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Record loan payment
const recordPayment = async (req, res) => {
  try {
    const { amount, date } = req.body;
    const loan = await PersonalLoan.findById(req.params.id);

    if (!loan) throw createError(404, 'Personal loan not found');
    if (loan.status !== 'Approved') throw createError(400, 'Cannot record payment for unapproved loan');
    if (amount > loan.remainingBalance) throw createError(400, 'Payment amount exceeds remaining balance');

    // Add payment record
    loan.payments.push({
      amount,
      date: date || new Date(),
      status: 'Paid'
    });

    // Update remaining balance
    loan.remainingBalance -= amount;

    // Update next payment date
    if (loan.remainingBalance > 0) {
      loan.nextPaymentDate = new Date();
      loan.nextPaymentDate.setMonth(loan.nextPaymentDate.getMonth() + 1);
    }

    await loan.save();
    res.json(loan);
  } catch (error) {
      throw createError(error.statusCode || 500, error.message);
  }
};

// Get loan statistics
const getLoanStats = async (req, res) => {
  try {
    const stats = await PersonalLoan.aggregate([
      { $match: { status: 'Approved' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayable: { $sum: '$totalPayable' },
          averageInterestRate: { $avg: '$interestRate' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats[0] || {
      totalAmount: 0,
      totalPayable: 0,
      averageInterestRate: 0,
      count: 0
    });
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Delete personal loan
const deletePersonalLoan = async (req, res) => {
  try {
    const loan = await PersonalLoan.findById(req.params.id);
    if (!loan) {
      throw createError(404, 'Personal loan not found');
    }

    // Only allow deletion of pending loans
    if (loan.status !== 'Pending') {
      throw createError(400, 'Cannot delete a loan that has been processed');
    }

    await PersonalLoan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Personal loan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting personal loan:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      status: 'error',
      message
    });
  }
};

module.exports = {
  createPersonalLoan,
  getPersonalLoans,
  getPersonalLoanById,
  updatePersonalLoan,
  processLoanApplication,
  recordPayment,
  getLoanStats,
  deletePersonalLoan
};