const express = require('express');
const router = express.Router();
const { 
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignStats
} = require('../controllers/campaignController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protect);

// Campaign CRUD operations
router.route('/')
  .post(checkSubscription('email_campaigns'), createCampaign)
  .get(getCampaigns);

router.route('/:id')
  .get(getCampaignById)
  .put(checkSubscription('email_campaigns'), updateCampaign)
  .delete(deleteCampaign);

// Campaign actions
router.post('/:id/send', checkSubscription('email_campaigns'), sendCampaign);
router.get('/:id/stats', getCampaignStats);

module.exports = router;