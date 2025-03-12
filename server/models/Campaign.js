const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'completed', 'paused', 'failed'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['regular', 'automated', 'ai-generated'],
    default: 'regular'
  },
  schedule: {
    scheduled: {
      type: Boolean,
      default: false
    },
    datetime: Date,
    timezone: String
  },
  contactLists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactList'
  }],
  stats: {
    total: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    unsubscribed: {
      type: Number,
      default: 0
    }
  },
  trackingEnabled: {
    type: Boolean,
    default: true
  },
  personalization: {
    fields: [String],
    aiEnhanced: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
CampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Campaign', CampaignSchema);