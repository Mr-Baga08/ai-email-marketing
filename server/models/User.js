const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  company: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'cancelled'],
      default: 'inactive'
    },
    features: [{
      name: String,
      active: Boolean
    }],
    aiEmailAutomation: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    customerId: String,
    subscriptionId: String
  },
  emailIntegration: {
    provider: {
      type: String,
      enum: ['titan', 'gmail', 'outlook', 'salesgrid', 'other', 'none'],
      default: 'none'
    },
    credentials: {
      email: String,
      refreshToken: String,
      accessToken: String,
      tokenExpiry: Date
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    emailSignature: {
      type: String,
      default: ''
    },
    aiSettings: {
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1
      },
      model: {
        type: String,
        default: 'gpt-3.5-turbo'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);