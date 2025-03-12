const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContactList'
  }],
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  firstName: String,
  lastName: String,
  company: String,
  position: String,
  phone: String,
  address: {
    street: String,
    city: String,
    state: String,
    postal: String,
    country: String
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'complained'],
    default: 'active'
  },
  emailsSent: {
    type: Number,
    default: 0
  },
  emailsOpened: {
    type: Number,
    default: 0
  },
  lastEmailSent: Date,
  lastOpened: Date,
  unsubscribeReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate emails per user
ContactSchema.index({ user: 1, email: 1 }, { unique: true });

// Update the updatedAt field on save
ContactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Contact', ContactSchema);