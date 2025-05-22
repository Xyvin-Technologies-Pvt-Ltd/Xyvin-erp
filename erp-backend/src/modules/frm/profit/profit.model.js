const mongoose = require('mongoose');

const profitSchema = new mongoose.Schema({
  profitNumber: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Pending'
  },
  notes: {
    type: String
  },
  documents: [{
    fileName: String,
    fileUrl: String
  }]
}, {
  timestamps: true
});

const Profit = mongoose.model('Profit', profitSchema);

module.exports = Profit; 