const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',  // Changed from 'User' to 'Employee'
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_COMPLETED', 'LEAVE_REQUEST', 'LEAVE_REVIEW', 'INVOICE_REQUIRED']
  },
  read: {
    type: Boolean,
    default: false
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'  // Changed from 'User' to 'Employee'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);