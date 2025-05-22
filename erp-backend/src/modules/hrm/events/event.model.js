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
  timestamps: true
});

// Middleware to update status before saving
eventSchema.pre('save', function(next) {
  const currentDate = new Date();
  
  if (currentDate < this.startDate) {
    this.status = 'upcoming';
  } else if (currentDate >= this.startDate && currentDate <= this.endDate) {
    this.status = 'ongoing';
  } else if (currentDate > this.endDate) {
    this.status = 'completed';
  }
  
  next();
});

// Middleware to update status before updates
eventSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  const currentDate = new Date();
  
  let startDate = update.startDate || (await this.model.findOne(this.getQuery())).startDate;
  let endDate = update.endDate || (await this.model.findOne(this.getQuery())).endDate;
  
  if (update.startDate) startDate = new Date(update.startDate);
  if (update.endDate) endDate = new Date(update.endDate);
  
  if (currentDate < startDate) {
    update.status = 'upcoming';
  } else if (currentDate >= startDate && currentDate <= endDate) {
    update.status = 'ongoing';
  } else if (currentDate > endDate) {
    update.status = 'completed';
  }
  
  next();
});

module.exports = mongoose.model('Event', eventSchema); 