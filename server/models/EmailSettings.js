const mongoose = require('mongoose');

const EmailSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  provider: {
    type: String,
    enum: ['titan', 'gmail', 'outlook', 'custom', 'none'],
    default: 'none'
  },
  credentials: {
    email: String,
    password: String, // Note: In production, passwords should be secured properly
    server: String,
    port: Number,
    secure: Boolean,
    authType: {
      type: String,
      enum: ['plain', 'oauth2', 'none'],
      default: 'plain'
    },
    refreshToken: String,
    accessToken: String,
    tokenExpiry: Date
  },
  verified: {
    type: Boolean,
    default: false
  },
  default: {
    senderName: String,
    replyTo: String
  },
  limits: {
    dailySendLimit: {
      type: Number,
      default: 1000
    },
    emailsPerHour: {
      type: Number,
      default: 100
    }
  },
  tracking: {
    enabled: {
      type: Boolean, 
      default: true
    },
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    },
    customDomain: String
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
EmailSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailSettings', EmailSettingsSchema);