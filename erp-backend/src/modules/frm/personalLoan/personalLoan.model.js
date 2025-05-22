const mongoose = require('mongoose');

const personalLoanSchema = new mongoose.Schema({
  purpose: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
  },
  term: {
    type: Number,
    required: true,
    min: 1,
    max: 60 // Maximum 60 months (5 years)
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 30 // Maximum 30% interest rate
  },
  employmentType: {
    type: String,
    required: true,
    enum: ['Full-time', 'Part-time', 'Contract']
  },
  monthlyIncome: {
    type: Number,
    required: true,
    min: 1000
  },
  existingLoans: [{
    lender: {
      type: String,
    },
    amount: {
      type: Number,
      min: 0
    },
    remainingBalance: {
      type: Number,
      min: 0
    },
    monthlyPayment: {
      type: Number,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  approvalDate: {
    type: Date
  },
  documents: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  monthlyPayment: {
    type: Number,
    min: 0
  },
  totalPayable: {
    type: Number,
    min: 0
  },
  remainingBalance: {
    type: Number,
    min: 0
  },
  nextPaymentDate: {
    type: Date
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending'
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Pre-save hook to calculate loan details
personalLoanSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('term') || this.isModified('interestRate')) {
    // Calculate monthly payment using the loan amortization formula
    const principal = this.amount;
    const monthlyInterestRate = (this.interestRate / 100) / 12;
    const numberOfPayments = this.term;

    // Monthly Payment = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
    // where P = Principal, r = Monthly Interest Rate, n = Number of Payments
    this.monthlyPayment = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
                         (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

    // Calculate total payable amount
    this.totalPayable = this.monthlyPayment * numberOfPayments;

    // Set initial remaining balance
    if (this.isNew) {
      this.remainingBalance = this.totalPayable;
    }
  }
  next();
});

// Add indexes for better query performance
personalLoanSchema.index({ status: 1, applicant: 1 });
personalLoanSchema.index({ approvalDate: -1 });
personalLoanSchema.index({ nextPaymentDate: 1 });

const PersonalLoan = mongoose.model('PersonalLoan', personalLoanSchema);

module.exports = PersonalLoan; 