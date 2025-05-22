const mongoose = require('mongoose');

const officeLoanSchema = new mongoose.Schema({
  purpose: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  amount: {
    type: Number,
    // required: true,
    min: 100
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  justification: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  requestDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  requestedBy: {
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
      // required: true
    },
    fileUrl: {
      type: String,
      // required: true
    },
    type: {
      type: String,
      enum: ['Quotation', 'Invoice', 'Other'],
      // required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  repaymentPlan: {
    installments: {
      type: Number,
      min: 1,
      max: 60
    },
    frequency: {
      type: String,
      enum: ['Monthly', 'Quarterly', 'Annually']
    },
    startDate: {
      type: Date
    },
    installmentAmount: {
      type: Number,
      min: 0
    }
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
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    }
  }],
  remainingBalance: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate installment amount and set remaining balance
officeLoanSchema.pre('save', function(next) {
  if (this.isModified('amount') || (this.isModified('repaymentPlan') && this.repaymentPlan)) {
    // Calculate installment amount if repayment plan exists
    if (this.repaymentPlan && this.repaymentPlan.installments) {
      this.repaymentPlan.installmentAmount = this.amount / this.repaymentPlan.installments;
    }

    // Set initial remaining balance for new loans or when amount is modified
    if (this.isNew || this.isModified('amount')) {
      this.remainingBalance = this.amount;
    }
  }
  next();
});

// Add indexes for better query performance
officeLoanSchema.index({ status: 1, requestedBy: 1 });
officeLoanSchema.index({ department: 1 });
officeLoanSchema.index({ requestDate: -1 });
officeLoanSchema.index({ approvalDate: -1 });

const OfficeLoan = mongoose.model('OfficeLoan', officeLoanSchema);

module.exports = OfficeLoan; 