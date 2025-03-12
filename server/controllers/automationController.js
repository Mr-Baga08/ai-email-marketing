const AutomatedEmail = require('../models/AutomatedEmail');
const KnowledgeBase = require('../models/KnowledgeBase');
const User = require('../models/User');
const emailService = require('../services/email/emailService');
const aiService = require('../services/ai/aiService');
const { monitorInbox, stopMonitoring } = require('../services/automation/inboxMonitorService');

// @desc   Start email automation
// @route  POST /api/automation/start
// @access Private
exports.startAutomation = async (req, res) => {
  try {
    const { interval } = req.body;
    
    // Validate user has AI email automation
    if (!req.user.subscription.aiEmailAutomation) {
      return res.status(403).json({ 
        message: 'Your subscription does not include AI Email Automation' 
      });
    }
    
    // Validate user has email integration set up
    if (!req.user.emailIntegration.verified) {
      return res.status(400).json({ 
        message: 'Email integration not set up or verified' 
      });
    }
    
    // Check if we have enough knowledge base entries
    const knowledgeBaseCount = await KnowledgeBase.countDocuments({ user: req.user.id });
    if (knowledgeBaseCount < 3) {
      return res.status(400).json({ 
        message: 'Please add at least 3 entries to your knowledge base before starting automation' 
      });
    }
    
    // Start monitoring inbox
    const monitoringInterval = interval || 5; // Default to 5 minutes
    monitorInbox(req.user, monitoringInterval);
    
    // Update user settings
    await User.findByIdAndUpdate(req.user.id, {
      'settings.automation': {
        active: true,
        interval: monitoringInterval,
        lastStarted: new Date()
      }
    });
    
    res.json({
      success: true,
      message: `Email automation started, checking every ${monitoringInterval} minutes`
    });
  } catch (error) {
    console.error('Start automation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Stop email automation
// @route  POST /api/automation/stop
// @access Private
exports.stopAutomation = async (req, res) => {
  try {
    // Stop monitoring inbox
    stopMonitoring(req.user.id);
    
    // Update user settings
    await User.findByIdAndUpdate(req.user.id, {
      'settings.automation.active': false
    });
    
    res.json({
      success: true,
      message: 'Email automation stopped'
    });
  } catch (error) {
    console.error('Stop automation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get automation status
// @route  GET /api/automation/status
// @access Private
exports.getAutomationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get statistics
    const stats = await getAutomationStats(req.user.id);
    
    res.json({
      success: true,
      status: user.settings?.automation?.active ? 'running' : 'stopped',
      settings: user.settings?.automation || {
        active: false,
        interval: 5
      },
      stats
    });
  } catch (error) {
    console.error('Get automation status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get automation history
// @route  GET /api/automation/history
// @access Private
exports.getAutomationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    if (category && category !== 'all') {
      if (category === 'needs_review') {
        query.needsHumanReview = true;
      } else {
        query.category = category;
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get emails with pagination
    const emails = await AutomatedEmail.find(query)
      .sort({ receivedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total
    const total = await AutomatedEmail.countDocuments(query);
    
    res.json({
      success: true,
      data: emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get automation history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get automated email by ID
// @route  GET /api/automation/emails/:id
// @access Private
exports.getAutomatedEmail = async (req, res) => {
  try {
    const email = await AutomatedEmail.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ success: true, email });
  } catch (error) {
    console.error('Get automated email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Manually send a response to an automated email
// @route  POST /api/automation/emails/:id/send
// @access Private
exports.sendResponse = async (req, res) => {
  try {
    const { responseText } = req.body;
    
    if (!responseText) {
      return res.status(400).json({ message: 'Response text is required' });
    }
    
    const email = await AutomatedEmail.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Don't allow resending if already sent
    if (email.responseSent) {
      return res.status(400).json({ message: 'Response already sent for this email' });
    }
    
    // Send email using email service
    const result = await emailService.sendReply({
      originalMessageId: email.messageId,
      to: email.from,
      subject: `Re: ${email.subject}`,
      text: responseText,
      user: req.user
    });
    
    // Update email record
    email.responseGenerated = true;
    email.responseSent = true;
    email.responseText = responseText;
    email.responseDate = new Date();
    email.needsHumanReview = false;
    
    await email.save();
    
    res.json({
      success: true,
      message: 'Response sent successfully',
      email
    });
  } catch (error) {
    console.error('Send response error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Add entry to knowledge base
// @route  POST /api/automation/knowledge-base
// @access Private
exports.addToKnowledgeBase = async (req, res) => {
  try {
    const { content, category, tags } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Generate embedding
    let embedding = [];
    try {
      const embeddingResult = await aiService.getEmbedding(content);
      if (embeddingResult.success) {
        embedding = embeddingResult.embedding;
      }
    } catch (err) {
      console.warn('Error generating embedding:', err);
      // Continue without embedding
    }
    
    // Create knowledge base entry
    const entry = await KnowledgeBase.create({
      user: req.user.id,
      content,
      embedding,
      category: category || 'General',
      tags: tags || [],
      metadata: {
        source: 'manual'
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Content added to knowledge base',
      entry
    });
  } catch (error) {
    console.error('Add to knowledge base error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get knowledge base entries
// @route  GET /api/automation/knowledge-base
// @access Private
exports.getKnowledgeBase = async (req, res) => {
  try {
    const entries = await KnowledgeBase.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      entries
    });
  } catch (error) {
    console.error('Get knowledge base error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Delete knowledge base entry
// @route  DELETE /api/automation/knowledge-base/:id
// @access Private
exports.deleteKnowledgeBaseEntry = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Knowledge base entry not found' });
    }
    
    await entry.remove();
    
    res.json({
      success: true,
      message: 'Knowledge base entry removed'
    });
  } catch (error) {
    console.error('Delete knowledge base entry error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to get automation statistics
async function getAutomationStats(userId) {
  try {
    // Total processed
    const totalProcessed = await AutomatedEmail.countDocuments({ user: userId });
    
    // Total responded
    const totalResponded = await AutomatedEmail.countDocuments({ 
      user: userId,
      responseSent: true
    });
    
    // Emails needing human review
    const needsReview = await AutomatedEmail.countDocuments({ 
      user: userId,
      needsHumanReview: true
    });
    
    // Calculate average response time
    const respondedEmails = await AutomatedEmail.find({ 
      user: userId,
      responseSent: true,
      responseDate: { $exists: true },
      receivedDate: { $exists: true }
    });
    
    let avgResponseTime = 0;
    if (respondedEmails.length > 0) {
      const totalResponseTime = respondedEmails.reduce((sum, email) => {
        return sum + (email.responseDate - email.receivedDate);
      }, 0);
      
      avgResponseTime = totalResponseTime / respondedEmails.length;
      // Convert to minutes
      avgResponseTime = Math.round(avgResponseTime / (1000 * 60));
    }
    
    // Category breakdown
    const categories = await AutomatedEmail.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const categoryStats = categories.reduce((obj, item) => {
      obj[item._id] = item.count;
      return obj;
    }, {});
    
    return {
      totalProcessed,
      totalResponded,
      needsReview,
      avgResponseTime,
      categories: categoryStats
    };
  } catch (error) {
    console.error('Get automation stats error:', error);
    return {
      totalProcessed: 0,
      totalResponded: 0,
      needsReview: 0,
      avgResponseTime: 0,
      categories: {}
    };
  }
}