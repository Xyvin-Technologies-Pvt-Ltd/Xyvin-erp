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
    enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'LEAVE_REQUEST', 'LEAVE_REVIEW', 'EVENT_CREATED','EVENT_UPDATED']
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