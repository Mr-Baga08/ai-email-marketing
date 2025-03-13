// server/models/KnowledgeBase.js
const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: [Number], // Vector embedding for semantic search
  category: {
    type: String,
    default: 'General'
  },
  tags: [String],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
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

// Add text index for keyword search
KnowledgeBaseSchema.index(
  { content: 'text', category: 'text', tags: 'text' },
  { weights: { content: 10, category: 5, tags: 3 } }
);

// Update the updatedAt field on save
KnowledgeBaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);