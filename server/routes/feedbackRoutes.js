const express = require('express');
const router = express.Router();
const { 
  submitFeedback,
  getFeedbackHistory,
  getFeedbackStats
} = require('../controllers/feedbackController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// All routes need authentication and AI email automation subscription
router.use(protect);
router.use(checkSubscription('aiEmailAutomation'));

router.route('/')
  .post(submitFeedback)
  .get(getFeedbackHistory);

router.get('/stats', getFeedbackStats);

module.exports = router;