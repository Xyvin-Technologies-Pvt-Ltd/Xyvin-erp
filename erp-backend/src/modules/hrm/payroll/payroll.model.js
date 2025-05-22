const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  period: {
    type: Date,
    required: true
  },
  basicSalary: {
    type: Number,
    required: true
  },
  allowances: {
    mobile: {
      type: Number,
      default: 0
    },
    transport: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  deductions: {
    pf: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  netSalary: {
    type: Number,
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'paid'],
    default: 'pending'
  },
  remarks: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate total allowances
payrollSchema.virtual('totalAllowances').get(function() {
  return Object.values(this.allowances).reduce((a, b) => a + b, 0);
});

// Calculate total deductions
payrollSchema.virtual('totalDeductions').get(function() {
  return Object.values(this.deductions).reduce((a, b) => a + b, 0);
});

// Pre-save middleware to calculate net salary
payrollSchema.pre('save', function(next) {
  if (this.isModified('basicSalary') || this.isModified('allowances') || this.isModified('deductions')) {
    const totalAllowances = this.totalAllowances;
    const totalDeductions = this.totalDeductions;
    this.netSalary = this.basicSalary + totalAllowances - totalDeductions;
  }
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema); 