// server/middleware/validationMiddleware.js
exports.validateUserId = (req, res, next) => {
    const { id } = req.params;
    
    // Check if ID is in valid format (e.g., for MongoDB)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    next();
  };
  
  exports.validateUserUpdate = (req, res, next) => {
    const { name, email, role } = req.body;
    
    // Basic validation examples - enhance as needed
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Prevent regular users from changing roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to change user roles'
      });
    }
    
    next();
  };