const express = require('express');
const router = express.Router();
const { 
  startAutomation,
  stopAutomation,
  getAutomationStatus,
  getAutomationHistory,
  getAutomatedEmail,
  sendResponse,
  addToKnowledgeBase,
  getKnowledgeBase,
  deleteKnowledgeBaseEntry
} = require('../controllers/automationController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// All routes need authentication and AI email automation subscription
router.use(protect);
router.use(checkSubscription('aiEmailAutomation'));

// Automation control
router.post('/start', startAutomation);
router.post('/stop', stopAutomation);
router.get('/status', getAutomationStatus);

// Automation history
router.get('/history', getAutomationHistory);
router.get('/emails/:id', getAutomatedEmail);
router.post('/emails/:id/send', sendResponse);

// Knowledge base
router.route('/knowledge-base')
  .post(addToKnowledgeBase)
  .get(getKnowledgeBase);

router.delete('/knowledge-base/:id', deleteKnowledgeBaseEntry);

module.exports = router;