// server/routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const { 
  verifyEmailCredentials,
  initiateOAuth,
  completeOAuth,
  getEmailIntegrationStatus,
  disconnectEmailIntegration
} = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protect);

// Email integration routes
router.post('/email/verify', verifyEmailCredentials);
router.get('/email/status', getEmailIntegrationStatus);
router.delete('/email', disconnectEmailIntegration);

// OAuth routes
router.get('/oauth/:provider', initiateOAuth);
router.post('/oauth/:provider/callback', completeOAuth);

module.exports = router;