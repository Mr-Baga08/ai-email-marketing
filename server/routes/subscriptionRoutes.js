// server/routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSubscription, 
  updateSubscription, 
  cancelSubscription,
  getPlans,
  getSubscriptionHistory
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protect);

// Subscription routes
router.get('/', getSubscription);
router.put('/', updateSubscription);
router.delete('/', cancelSubscription);

// Get available plans
router.get('/plans', getPlans);

// Get subscription history
router.get('/history', getSubscriptionHistory);

module.exports = router;