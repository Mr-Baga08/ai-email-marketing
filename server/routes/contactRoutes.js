const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
  uploadContactList,
  createContactList,
  getContactLists,
  getContactListById,
  updateContactList,
  deleteContactList,
  getContactsFromList,
  addContactToList,
  removeContactFromList
} = require('../controllers/contactController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV and Excel files
    if (
      file.mimetype === 'text/csv' || 
      file.mimetype === 'application/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// All routes need authentication
router.use(protect);

// Contact list routes
router.route('/lists')
  .post(checkSubscription('contact_management'), createContactList)
  .get(getContactLists);

router.route('/lists/:id')
  .get(getContactListById)
  .put(checkSubscription('contact_management'), updateContactList)
  .delete(deleteContactList);

// Upload route
router.post(
  '/upload', 
  checkSubscription('contact_management'),
  upload.single('file'),
  uploadContactList
);

// Contact management within lists
router.route('/lists/:id/contacts')
  .get(getContactsFromList)
  .post(checkSubscription('contact_management'), addContactToList);

router.delete(
  '/lists/:id/contacts/:contactId', 
  checkSubscription('contact_management'),
  removeContactFromList
);

module.exports = router;