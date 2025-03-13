const mongoose = require('mongoose');

const EmailEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  messageId: {
    type: String,
    required: true,
    index: true
  },
  trackingId: {
    type: String,
    index: true
  },
  recipient: {
    email: String,
    name: String
  },
  eventType: {
    type: String,
    enum: ['send', 'delivery', 'open', 'click', 'bounce', 'complaint', 'unsubscribe'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    url: String,           // For click events
    userAgent: String,     // Browser/device info
    ipAddress: String,     // IP address (consider privacy laws)
    bounceType: String,    // For bounce events
    bounceReason: String,  // For bounce events
    status: String         // Status code
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Compound indexes for efficient querying
EmailEventSchema.index({ user: 1, eventType: 1 });
EmailEventSchema.index({ user: 1, campaign: 1 });
EmailEventSchema.index({ messageId: 1, eventType: 1 });

module.exports = mongoose.model('EmailEvent', EmailEventSchema);