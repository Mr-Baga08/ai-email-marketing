const mongoose = require('mongoose');

const AutomatedEmailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageId: String,
  subject: String,
  from: String, 
  to: String,
  receivedDate: Date,
  category: {
    type: String,
    enum: ['product_inquiry', 'customer_complaint', 'customer_feedback', 'unrelated'],
    default: 'unrelated'
  },
  responseGenerated: {
    type: Boolean,
    default: false
  },
  responseSent: {
    type: Boolean,
    default: false
  },
  responseText: String,
  responseDate: Date,
  needsHumanReview: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AutomatedEmail', AutomatedEmailSchema);