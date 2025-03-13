const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  messageId: {
    type: String,
    unique: true
  },
  campaignId: String,
  subject: String,
  content: String,
  recipientEmail: String,
  trackingId: String,
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed', 'opened', 'clicked', 'bounced', 'complained'],
    default: 'sent'
  },
  type: {
    type: String,
    enum: ['campaign', 'automated', 'ai-response', 'test'],
    default: 'campaign'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  openCount: {
    type: Number,
    default: 0
  },
  lastOpened: Date,
  clickCount: {
    type: Number,
    default: 0
  },
  lastClicked: Date,
  bounceReason: String,
  failureReason: String,
  sentAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailLog', EmailLogSchema);