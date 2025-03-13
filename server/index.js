// server/index.js - Fixed version
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import the database connection module - Fixed import
const { connectToDatabase } = require('./database');

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

let server;

// Request logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The endpoint ${req.originalUrl} does not exist`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('App Error:', err);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(err);
  }
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Server Error' : err.name || 'Error',
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown function
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  
  // Close the server
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      
      // Disconnect from MongoDB if connected
      if (mongoose.connection.readyState !== 0) {
        mongoose.connection.close(false).then(() => {
          console.log('MongoDB connection closed');
          process.exit(0);
        }).catch((err) => {
          console.error('Error during MongoDB disconnection:', err);
          process.exit(1);
        });
      } else {
        process.exit(0);
      }
      
      // Force exit after timeout
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000); // 10 seconds
    });
  } else {
    process.exit(0);
  }
};

// Start the application
const startApp = async () => {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Start the server
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Handle process termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // We don't exit the process here, just log the error
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start the application:', error);
    
    // In non-production, start the server even if database connection fails
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Starting server without database connection in development mode');
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (NO DATABASE CONNECTION)`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
      return server;
    }
    
    process.exit(1);
  }
};

// If this file is run directly (not imported as a module), start the application
if (require.main === module) {
  startApp();
}

if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

module.exports = app;