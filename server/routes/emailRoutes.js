const express = require('express');
const router = express.Router();
const { 
  sendTestEmail,
  sendBulkEmails,
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  getEmailTemplate,
  getEmailTrackingData,
  getEmailEventsByMessageId,
  trackEmailOpen,
  trackEmailClick,
  getEmailSettings,
  updateEmailSettings,
  verifyEmailSettings,
  getEmailProviders
} = require('../controllers/emailController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protect);

// Email settings
router.route('/settings')
  .get(getEmailSettings)
  .put(updateEmailSettings);

// Email verification
router.post('/verify-settings', verifyEmailSettings);

// Available email providers
router.get('/providers', getEmailProviders);

// Email templates
router.route('/templates')
  .get(getEmailTemplates)
  .post(checkSubscription('email_campaigns'), createEmailTemplate);

router.route('/templates/:id')
  .get(getEmailTemplate)
  .put(checkSubscription('email_campaigns'), updateEmailTemplate)
  .delete(deleteEmailTemplate);

// Email sending
router.post('/test', checkSubscription('email_campaigns'), sendTestEmail);
router.post('/send-bulk', checkSubscription('email_campaigns'), sendBulkEmails);

// Email tracking
router.get('/tracking', getEmailTrackingData);
router.get('/tracking/:messageId', getEmailEventsByMessageId);

// Tracking pixels and link redirects (public routes that don't need auth)
router.use('/track', express.Router()
  .get('/open/:trackingId', trackEmailOpen)
  .get('/click/:trackingId', trackEmailClick)
);

module.exports = router;