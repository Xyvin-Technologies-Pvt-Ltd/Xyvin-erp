const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    content: {
      type: String,
      required: false, // Made optional to allow messages with only attachments
      trim: true
    },
    attachmentUrl: {
      type: String,
      default: null
    },
    attachmentType: {
      type: String,
      enum: [null, 'image', 'pdf', 'doc', 'file'],
      default: null
    },
    attachmentName: {
      type: String,
      default: null
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Add validation to ensure either content or attachment is present
messageSchema.pre('validate', function(next) {
  if (!this.content && !this.attachmentUrl) {
    return next(new Error('Message must have either content or an attachment'));
  }
  next();
});

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);


