const express = require('express');
const router = express.Router();
const { 
  createKnowledgeBaseEntry,
  getKnowledgeBaseEntries,
  getKnowledgeBaseEntryById,
  getKnowledgeBaseCategories,
  updateKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  searchKnowledgeBase
} = require('../controllers/knowledgeBaseController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// All routes need authentication
router.use(protect);

// Routes that need AI automation subscription
router.use(checkSubscription('aiEmailAutomation'));

// Get and create knowledge base entries
router.route('/')
  .get(getKnowledgeBaseEntries)
  .post(createKnowledgeBaseEntry);

// Search knowledge base
router.route('/search')
  .post(searchKnowledgeBase);

// Get categories (if needed as a separate endpoint)
router.route('/categories')
  .get(getKnowledgeBaseCategories);

// Get, update and delete specific entry
router.route('/:id')
  .get(getKnowledgeBaseEntryById)
  .put(updateKnowledgeBaseEntry)
  .delete(deleteKnowledgeBaseEntry);

module.exports = router;
