// server/routes/knowledgeBaseRoutes.js
const express = require('express');
const router = express.Router();
const { 
  addEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  searchKnowledgeBase
} = require('../controllers/knowledgeBaseController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// All routes need authentication and AI email automation subscription
router.use(protect);
router.use(checkSubscription('aiEmailAutomation'));

// CRUD operations
router.route('/')
  .post(addEntry)
  .get(getEntries);

router.route('/:id')
  .get(getEntryById)
  .put(updateEntry)
  .delete(deleteEntry);

// Search functionality
router.get('/search', searchKnowledgeBase);

module.exports = router;