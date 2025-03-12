const Feedback = require('../models/Feedback');
const AutomatedEmail = require('../models/AutomatedEmail');
const rlhfService = require('../services/ai/rlhfService');

// @desc   Submit feedback for an AI-generated email response
// @route  POST /api/feedback
// @access Private
exports.submitFeedback = async (req, res) => {
  try {
    const { 
      automatedEmailId, 
      feedbackType, 
      rating, 
      improvedResponse, 
      feedbackNotes,
      improvements 
    } = req.body;
    
    // Find the automated email
    const automatedEmail = await AutomatedEmail.findOne({
      _id: automatedEmailId,
      user: req.user.id
    });
    
    if (!automatedEmail) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    // Create feedback record
    const feedback = await Feedback.create({
      user: req.user.id,
      automatedEmail: automatedEmailId,
      originalResponse: automatedEmail.responseText,
      improvedResponse: improvedResponse || automatedEmail.responseText,
      feedbackType,
      rating: rating || null,
      feedbackNotes,
      improvements
    });
    
    // If this is an edit, update the original email with improved version
    if (feedbackType === 'edit' && improvedResponse) {
      automatedEmail.responseText = improvedResponse;
      automatedEmail.needsHumanReview = false;
      automatedEmail.metadata = {
        ...automatedEmail.metadata,
        humanEdited: true,
        editedAt: new Date()
      };
      await automatedEmail.save();
    }
    
    // Send this feedback to the RLHF training service
    rlhfService.processFeedback(feedback);
    
    res.status(201).json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get feedback history
// @route  GET /api/feedback
// @access Private
exports.getFeedbackHistory = async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('automatedEmail', 'subject category receivedDate');
    
    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Get feedback history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get feedback statistics
// @route  GET /api/feedback/stats
// @access Private
exports.getFeedbackStats = async (req, res) => {
  try {
    // Get overall statistics
    const totalFeedback = await Feedback.countDocuments({ user: req.user.id });
    
    // Count by feedback type
    const feedbackTypeStats = await Feedback.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$feedbackType', count: { $sum: 1 } } }
    ]);
    
    // Average rating
    const ratingStats = await Feedback.aggregate([
      { $match: { user: req.user.id, rating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    // Improvement areas
    const improvementStats = await Feedback.aggregate([
      { $match: { user: req.user.id } },
      { $unwind: '$improvements' },
      { $group: { _id: '$improvements', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      stats: {
        total: totalFeedback,
        byType: feedbackTypeStats.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {}),
        rating: ratingStats.length > 0 ? {
          average: ratingStats[0].avgRating,
          count: ratingStats[0].count
        } : { average: 0, count: 0 },
        improvements: improvementStats.reduce((obj, item) => {
          obj[item._id] = item.count;
          return obj;
        }, {})
      },
      rlhfMetrics: await rlhfService.getTrainingMetrics(req.user.id)
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};