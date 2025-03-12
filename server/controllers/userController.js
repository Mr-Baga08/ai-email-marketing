// server/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update allowed fields
    const { name, email, role, subscription, company } = req.body;
    
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (company) user.company = company;
    
    // Handle subscription update
    if (subscription) {
      // Update only specific subscription fields to prevent overwriting
      if (subscription.plan) user.subscription.plan = subscription.plan;
      if (subscription.status) user.subscription.status = subscription.status;
      if (subscription.features) user.subscription.features = subscription.features;
      if (subscription.aiEmailAutomation !== undefined) {
        user.subscription.aiEmailAutomation = subscription.aiEmailAutomation;
      }
      if (subscription.startDate) user.subscription.startDate = subscription.startDate;
      if (subscription.endDate) user.subscription.endDate = subscription.endDate;
      if (subscription.customerId) user.subscription.customerId = subscription.customerId;
      if (subscription.subscriptionId) user.subscription.subscriptionId = subscription.subscriptionId;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      company: updatedUser.company,
      subscription: updatedUser.subscription
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Cannot delete self
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await user.remove();
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user subscription
// @route   PUT /api/users/subscription
// @access  Private
exports.updateSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { plan, aiEmailAutomation } = req.body;
    
    // Validate plan
    if (plan && !['free', 'basic', 'premium', 'enterprise'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }
    
    // Update subscription
    if (plan) {
      user.subscription.plan = plan;
      user.subscription.status = 'active';
      user.subscription.startDate = new Date();
      
      // Set default features based on plan
      switch (plan) {
        case 'free':
          user.subscription.features = [
            { name: 'basic_email_campaigns', active: true },
            { name: 'contact_management', active: true },
            { name: 'template_editor', active: true }
          ];
          break;
        case 'basic':
          user.subscription.features = [
            { name: 'basic_email_campaigns', active: true },
            { name: 'contact_management', active: true },
            { name: 'template_editor', active: true },
            { name: 'campaign_analytics', active: true },
            { name: 'email_support', active: true }
          ];
          break;
        case 'premium':
          user.subscription.features = [
            { name: 'basic_email_campaigns', active: true },
            { name: 'contact_management', active: true },
            { name: 'template_editor', active: true },
            { name: 'campaign_analytics', active: true },
            { name: 'email_support', active: true },
            { name: 'advanced_segmentation', active: true },
            { name: 'a_b_testing', active: true },
            { name: 'priority_support', active: true }
          ];
          break;
        case 'enterprise':
          user.subscription.features = [
            { name: 'basic_email_campaigns', active: true },
            { name: 'contact_management', active: true },
            { name: 'template_editor', active: true },
            { name: 'campaign_analytics', active: true },
            { name: 'email_support', active: true },
            { name: 'advanced_segmentation', active: true },
            { name: 'a_b_testing', active: true },
            { name: 'priority_support', active: true },
            { name: 'dedicated_account_manager', active: true },
            { name: 'custom_integrations', active: true },
            { name: 'sla_guarantees', active: true },
            { name: 'phone_support', active: true }
          ];
          break;
      }
    }
    
    // Update AI Email Automation addon if provided
    if (aiEmailAutomation !== undefined) {
      user.subscription.aiEmailAutomation = aiEmailAutomation;
    }
    
    await user.save();
    
    // Generate fresh JWT with updated user data
    const secret = await getJwtSecret();
    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: '30d'
    });
    
    res.json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user usage statistics
// @route   GET /api/users/usage
// @access  Private
exports.getUserUsage = async (req, res) => {
  try {
    // This would typically query across multiple collections to gather usage data
    // For now, we'll return some placeholder stats
    
    res.json({
      emailsSent: 0,
      contactsCount: 0,
      campaignsCount: 0,
      storageUsed: 0,
      automationResponses: 0,
      lastActivity: new Date()
    });
  } catch (error) {
    console.error('Error getting user usage:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Search users (admin only)
// @route   GET /api/users/search
// @access  Private/Admin
exports.searchUsers = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    // Build search filter
    const filter = {};
    
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .limit(Number(limit));
    
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user dashboard summary
// @route   GET /api/users/dashboard
// @access  Private
exports.getDashboardSummary = async (req, res) => {
  try {
    // In a real implementation, this would aggregate data from various collections
    // to provide a summary of the user's activities and key metrics
    
    // For now, return placeholder data
    res.json({
      recentActivity: [],
      stats: {
        totalEmails: 0,
        openRate: 0,
        clickRate: 0,
        totalContacts: 0,
        automationResponses: 0
      },
      recentCampaigns: [],
      upcomingCampaigns: []
    });
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};