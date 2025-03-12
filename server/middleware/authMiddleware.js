const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const secretClient = new SecretManagerServiceClient();

// Helper to get JWT secret from Secret Manager
const getJwtSecret = async () => {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/jwt-secret/versions/latest`,
    });
    return version.payload.data.toString();
  } catch (error) {
    console.error('Error accessing JWT secret:', error);
    return process.env.JWT_SECRET || 'fallbacksecret'; // Fallback for dev environment
  }
};

// Protect routes
exports.protect = async (req, res, next) => {
    let token;
  
    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        // Get token from header
        token = req.headers.authorization.split(' ')[1];
  
        // Verify token
        const secret = await getJwtSecret();
        const decoded = jwt.verify(token, secret);
  
        // Get user from token
        req.user = await User.findById(decoded.id).select('-password');
  
        if (!req.user) {
          res.status(401);
          throw new Error('Not authorized, user not found');
        }
  
        next();
      } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401);
        throw new Error('Not authorized, token failed');
      }
    }
  
    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
  };
  
  // Admin middleware
  exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403);
      throw new Error('Not authorized as an admin');
    }
  };
  
  // Check subscription for specific feature
  exports.checkSubscription = (feature) => {
    return (req, res, next) => {
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized');
      }
  
      // Check if user has AI email automation feature
      if (feature === 'aiEmailAutomation' && !req.user.subscription.aiEmailAutomation) {
        res.status(403);
        throw new Error('Your subscription does not include AI Email Automation');
      }
  
      // Check subscription status
      if (req.user.subscription.status !== 'active') {
        res.status(403);
        throw new Error('Your subscription is not active');
      }
  
      // Check for specific features in the subscription
      if (feature && feature !== 'aiEmailAutomation') {
        const hasFeature = req.user.subscription.features.some(
          f => f.name === feature && f.active
        );
  
        if (!hasFeature) {
          res.status(403);
          throw new Error(`Your subscription does not include ${feature}`);
        }
      }
  
      next();
    };
  };