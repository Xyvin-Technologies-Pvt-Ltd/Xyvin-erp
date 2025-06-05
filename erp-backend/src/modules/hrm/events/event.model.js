const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    // validate: {
    //   validator: function(value) {
    //     return value >= this.startDate;
    //   },
    //   message: 'End date must be after start date'
    // }
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Helper function to get end of day for a date
const getEndOfDay = (date) => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

// Helper function to calculate status
const calculateStatus = (startDate, endDate) => {
  const currentDate = new Date();
  const endOfEndDate = getEndOfDay(endDate);
  
  if (currentDate < startDate) {
    return 'upcoming';
  } else if (currentDate >= startDate && currentDate <= endOfEndDate) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

// Virtual for dynamic status
eventSchema.virtual('currentStatus').get(function() {
  return calculateStatus(this.startDate, this.endDate);
});

// Transform the document when converting to JSON
eventSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.status = ret.currentStatus;
    delete ret.currentStatus;
    return ret;
  }
});

// Middleware to update status before saving
eventSchema.pre('save', function(next) {
  this.status = calculateStatus(this.startDate, this.endDate);
  next();
});

// Middleware to update status before updates
eventSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  let startDate = update.startDate || (await this.model.findOne(this.getQuery())).startDate;
  let endDate = update.endDate || (await this.model.findOne(this.getQuery())).endDate;
  
  if (update.startDate) startDate = new Date(update.startDate);
  if (update.endDate) endDate = new Date(update.endDate);
  
  update.status = calculateStatus(startDate, endDate);
  
  next();
});

module.exports = mongoose.model('Event', eventSchema); 