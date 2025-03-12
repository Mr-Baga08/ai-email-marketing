require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const emailRoutes = require('./routes/emailRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const automationRoutes = require('./routes/automationRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/feedback', feedbackRoutes);

// GCP Secret Manager setup
const secretClient = new SecretManagerServiceClient();

// Get MongoDB URI from Secret Manager
async function getMongoURI() {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/mongodb-uri/versions/latest`,
    });
    
    const mongoURI = version.payload.data.toString();
    
    // Connect to MongoDB
    mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    mongoose.connection.on('connected', () => {
      console.log('Connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  } catch (error) {
    console.error('Error accessing secret:', error);
    process.exit(1);
  }
}

// Connect to database
getMongoURI();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/integrations', integrationRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: 'Server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;