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
      trim: true
    },
    // Optional attachment support for images, pdf, docs, etc.
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

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);


