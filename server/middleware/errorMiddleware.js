// server/middleware/errorMiddleware.js
/**
 * Error handling middleware for the API
 * Processes errors and returns appropriate responses
 */

// Not Found middleware - handles 404 errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
  };
  
  // General error handler
  const errorHandler = (err, req, res, next) => {
    // Sometimes the status code might already be set in the response
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Set the status code
    res.status(statusCode);
    
    // Log the error in development or staging environments
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', err);
    }
    
    // Return error response with appropriate details
    res.json({
      message: err.message,
      // Only include the stack trace if not in production
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      // Include error code if available
      ...(err.code && { code: err.code })
    });
  };
  
  module.exports = { notFound, errorHandler };