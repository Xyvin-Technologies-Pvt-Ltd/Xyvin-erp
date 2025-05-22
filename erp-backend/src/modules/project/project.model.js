const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  budget: {
    type: Number,
    min: 0
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  buisness_attachements: [{
    type: String,
  }],
  technical_attachements: [{
    type: String,
  }],
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  }
}, {
  timestamps: true
});

// Add index for faster queries on team members and manager
projectSchema.index({ team: 1 });
projectSchema.index({ manager: 1 });
projectSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Project', projectSchema); 