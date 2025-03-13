const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// const secretClient = new SecretManagerServiceClient();

// // Helper to get JWT secret from Secret Manager
// const getJwtSecret = async () => {
//   try {
//     const [version] = await secretClient.accessSecretVersion({
//       name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/jwt-secret/versions/latest`,
//     });
//     return version.payload.data.toString();
//   } catch (error) {
//     console.error('Error accessing JWT secret:', error);
//     return process.env.JWT_SECRET || 'fallbacksecret'; // Fallback for dev environment
//   }
// };

// // Generate JWT Token
// const generateToken = async (userId) => {
//   const secret = await getJwtSecret();
//   return jwt.sign({ id: userId }, secret, {
//     expiresIn: '30d'
//   });
// };

// Initialize Secret Manager client conditionally
const useGcpServices = process.env.USE_GCP_SERVICES === 'true';
let secretClient;
if (useGcpServices) {
  secretClient = new SecretManagerServiceClient();
}

// Helper to get JWT secret from Secret Manager or env
const getJwtSecret = async () => {
  // If not using GCP services, just return the environment variable
  if (!useGcpServices) {
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET environment variable not set!');
      return 'development_jwt_secret_not_for_production';
    }
    return process.env.JWT_SECRET;
  }
  
  // If using GCP, try to get from Secret Manager
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/jwt-secret/versions/latest`,
    });
    return version.payload.data.toString();
  } catch (error) {
    console.error('Error accessing JWT secret:', error);
    // Fallback to environment variable
    if (process.env.JWT_SECRET) {
      console.warn('Falling back to JWT_SECRET environment variable');
      return process.env.JWT_SECRET;
    }
    throw new Error('Failed to get JWT secret from both Secret Manager and environment variables');
  }
};

// Generate JWT Token
const generateToken = async (userId) => {
  try {
    const secret = await getJwtSecret();
    return jwt.sign({ id: userId }, secret, {
      expiresIn: '30d'
    });
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      company,
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        features: [
          { name: 'basic_email_campaigns', active: true },
          { name: 'contact_management', active: true },
          { name: 'template_editor', active: true }
        ]
      }
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        subscription: user.subscription,
        token: await generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Auth user & get token
// @route  POST /api/auth/login
// @access Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      role: user.role,
      subscription: user.subscription,
      token: await generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get user profile
// @route  GET /api/auth/profile
// @access Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update user profile
// @route  PUT /api/auth/profile
// @access Private
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update allowed fields
    const { name, company, settings } = req.body;
    
    if (name) user.name = name;
    if (company) user.company = company;
    if (settings) {
      user.settings = {
        ...user.settings,
        ...settings
      };
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      company: updatedUser.company,
      role: updatedUser.role,
      subscription: updatedUser.subscription,
      settings: updatedUser.settings
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Change password
// @route  PUT /api/auth/change-password
// @access Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Request password reset
// @route  POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate reset token logic would go here
    // Send email with reset instructions
    
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update notification settings
    user.settings = {
      ...user.settings,
      notifications: req.body
    };
    
    await user.save();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      company: user.company,
      settings: user.settings
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};