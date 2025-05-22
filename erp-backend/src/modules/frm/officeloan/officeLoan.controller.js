const OfficeLoan = require('./officeLoan.model');
const { validateOfficeLoan } = require('../validations/officeLoanValidation');
const { createError } = require('../../../utils/errors');
const { uploadFile } = require('../../../utils/fileUpload');

// Create new office loan request
const createOfficeLoan = async (req, res) => {
  try {
    let loanData;
    let documents = [];

    // Handle multipart form data with files
    if (req.is('multipart/form-data')) {
      // Parse the JSON data string
      loanData = JSON.parse(req.body.data);
      
      // Handle file uploads
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
      // Handle JSON data without files
      loanData = req.body;
    }

    // Convert amount to number
    if (loanData.amount) {
      loanData.amount = parseFloat(loanData.amount);
    }

    // Convert installments to number
    if (loanData.repaymentPlan?.installments) {
      loanData.repaymentPlan.installments = parseInt(loanData.repaymentPlan.installments);
    }

    // Validate request body
    const { error } = validateOfficeLoan(loanData);
    if (error) {
      throw createError(400, error.details[0].message);
    }

    // Create new loan document
    const loan = new OfficeLoan({
      ...loanData,
      documents,
      requestedBy: req.user._id,
      requestDate: new Date(),
      status: 'Pending'
    });

    await loan.save();

    res.status(201).json({
      status: 'success',
      data: loan
    });
  } catch (error) {
    console.error('Error creating office loan:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      status: 'error',
      message
    });
  }
};

// Get all office loans (with filters)
const getOfficeLoans = async (req, res) => {
  try {
    const { status, department, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.department = department;
    if (startDate || endDate) {
      filter.requestDate = {};
      if (startDate) filter.requestDate.$gte = new Date(startDate);
      if (endDate) filter.requestDate.$lte = new Date(endDate);
    }

    const loans = await OfficeLoan.find(filter)
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name email')
      .sort({ requestDate: -1 });

    res.json(loans);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Get office loan by ID
const getOfficeLoanById = async (req, res) => {
  try {
    const loan = await OfficeLoan.findById(req.params.id)
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name email');

    if (!loan) {
      throw createError(404, 'Office loan not found');
    }

    res.json(loan);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Update office loan request
const updateOfficeLoan = async (req, res) => {
  try {
    const loan = await OfficeLoan.findById(req.params.id);
    if (!loan) {
      throw createError(404, 'Office loan not found');
    }

    let loanData;
    let documents = [...loan.documents]; // Keep existing documents

    // Handle multipart form data with files
    if (req.is('multipart/form-data')) {
      // Parse the JSON data string
      loanData = JSON.parse(req.body.data);
      
      // Handle file uploads
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
      // Handle JSON data without files
      loanData = req.body;
    }

    // Convert amount to number
    if (loanData.amount) {
      loanData.amount = parseFloat(loanData.amount);
    }

    // Convert installments to number
    if (loanData.repaymentPlan?.installments) {
      loanData.repaymentPlan.installments = parseInt(loanData.repaymentPlan.installments);
    }

    // Validate request body
    const { error } = validateOfficeLoan(loanData);
    if (error) {
      throw createError(400, error.details[0].message);
    }

    // Update loan with new data and documents
    Object.assign(loan, { ...loanData, documents });
    await loan.save();

    res.json(loan);
  } catch (error) {
    console.error('Error updating office loan:', error);
    throw createError(error.statusCode || 500, error.message);
  }
};

// Process loan request (approve/reject)
const processLoanRequest = async (req, res) => {
  try {
    const { status, notes, repaymentPlan } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      throw createError(400, 'Invalid status');
    }

    const loan = await OfficeLoan.findById(req.params.id);
    if (!loan) {
      throw createError(404, 'Office loan not found');
    }

    if (loan.status !== 'Pending') {
      throw createError(400, 'Loan request is already processed');
    }

    if (status === 'Approved' && !repaymentPlan) {
      throw createError(400, 'Repayment plan is required for approval');
    }

    loan.status = status;
    loan.approvedBy = req.user._id;
    loan.approvalDate = new Date();
    loan.notes = notes;

    if (status === 'Approved') {
      loan.repaymentPlan = repaymentPlan;
      loan.remainingBalance = loan.amount;
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
    const { amount, date, notes } = req.body;
    const loan = await OfficeLoan.findById(req.params.id);

    if (!loan) {
      throw createError(404, 'Office loan not found');
    }

    if (loan.status !== 'Approved') {
      throw createError(400, 'Cannot record payment for unapproved loan');
    }

    if (amount > loan.remainingBalance) {
      throw createError(400, 'Payment amount exceeds remaining balance');
    }

    loan.payments.push({
      amount,
      date: date || new Date(),
      notes,
      recordedBy: req.user._id
    });

    loan.remainingBalance -= amount;

    await loan.save();
    res.json(loan);
  } catch (error) {
    throw createError(error.statusCode || 500, error.message);
  }
};

// Get loan statistics by department
const getLoanStats = async (req, res) => {
  try {
    // Get all approved loans
    const allLoans = await OfficeLoan.find({});
    
    // Calculate overall statistics
    const overall = {
      totalAmount: 0,
      totalRemaining: 0,
      totalCount: allLoans.length,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      departmentBreakdown: []
    };

    // Group loans by department
    const departmentStats = {};
    
    allLoans.forEach(loan => {
      // Update overall stats
      overall.totalAmount += loan.amount || 0;
      overall.totalRemaining += loan.remainingBalance || 0;
      
      // Update status counts
      if (loan.status === 'Pending') overall.pendingCount++;
      if (loan.status === 'Approved') overall.approvedCount++;
      if (loan.status === 'Rejected') overall.rejectedCount++;

      // Update department stats
      if (!departmentStats[loan.department]) {
        departmentStats[loan.department] = {
          department: loan.department,
          totalAmount: 0,
          count: 0,
          remainingBalance: 0
        };
      }
      
      departmentStats[loan.department].totalAmount += loan.amount || 0;
      departmentStats[loan.department].count++;
      departmentStats[loan.department].remainingBalance += loan.remainingBalance || 0;
    });

    // Convert department stats to array
    overall.departmentBreakdown = Object.values(departmentStats);

    res.json(overall);
  } catch (error) {
    console.error('Error getting loan stats:', error);
    throw createError(error.statusCode || 500, error.message);
  }
};

// Delete office loan
const deleteOfficeLoan = async (req, res) => {
  try {
    const loan = await OfficeLoan.findById(req.params.id);
    if (!loan) {
      throw createError(404, 'Office loan not found');
    }

    await OfficeLoan.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Office loan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting office loan:', error);
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      status: 'error',
      message
    });
  }
};

module.exports = {
  createOfficeLoan,
  getOfficeLoans,
  getOfficeLoanById,
  updateOfficeLoan,
  processLoanRequest,
  recordPayment,
  getLoanStats,
  deleteOfficeLoan
};