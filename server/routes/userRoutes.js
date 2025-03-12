/**
 * User routes for managing user accounts
 * @module routes/userRoutes
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateUserId, validateUserUpdate } = require('../middleware/validationMiddleware');

// Ensure controller methods exist, provide fallbacks if needed
const {
  getAllUsers = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getUserById = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  updateUser = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  deleteUser = (req, res) => res.status(501).json({ message: 'Not implemented' }),
  getUserStats = (req, res) => res.status(501).json({ message: 'Not implemented' })
} = userController;

/**
 * Middleware to check if user has permission to access/modify user data
 * Allows access if the user is an admin or if they're accessing their own data
 */
const checkUserPermission = (req, res, next) => {
  try {
    if (req.user.role === 'admin' || req.user.id === req.params.id) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this user data'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking user permissions',
      error: error.message
    });
  }
};

// All routes require authentication
router.use(protect);

// Admin routes
router.get('/', admin, getAllUsers);
router.get('/stats', admin, getUserStats);

// User management routes with validation and permission checks
router.route('/:id')
  .get(validateUserId, checkUserPermission, getUserById)
  .put(validateUserId, validateUserUpdate, checkUserPermission, updateUser)
  .delete(validateUserId, checkUserPermission, deleteUser);

module.exports = router;