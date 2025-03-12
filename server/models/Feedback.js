const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  automatedEmail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomatedEmail',
    required: true
  },
  originalResponse: String,
  improvedResponse: String,
  feedbackType: {
    type: String,
    enum: ['edit', 'approve', 'reject'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.feedbackType === 'approve' || this.feedbackType === 'reject';
    }
  },
  feedbackNotes: String,
  improvements: [{
    type: String,
    enum: [
      'factual_accuracy', 
      'relevance', 
      'tone', 
      'grammar', 
      'clarity', 
      'completeness',
      'personalization'
    ]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);