/**
 * Utility functions for error handling and reporting
 */
import { trackError } from './analytics-utils';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Handle API errors
 * @param {Error} error - The error object
 * @param {Object} options - Error handling options
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, options = {}) => {
  const defaultOptions = {
    logToConsole: true,
    track: true,
    defaultMessage: 'An unexpected error occurred. Please try again.'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Create standardized error object
  const errorObj = {
    message: opts.defaultMessage,
    originalError: error,
    code: 'UNKNOWN_ERROR'
  };
  
  // Log to console if enabled
  if (opts.logToConsole) {
    console.error('API Error:', error);
  }
  
  // Handle axios errors
  if (error.response) {
    // Server responded with non-2xx status
    const status = error.response.status;
    const responseData = error.response.data;
    
    errorObj.status = status;
    errorObj.data = responseData;
    
    // Use server message if available
    if (responseData && responseData.message) {
      errorObj.message = responseData.message;
    }
    
    // Set appropriate error code
    if (status === 401) {
      errorObj.code = 'UNAUTHORIZED';
      errorObj.message = responseData.message || 'You are not authorized to perform this action.';
    } else if (status === 403) {
      errorObj.code = 'FORBIDDEN';
      errorObj.message = responseData.message || 'You do not have permission to perform this action.';
    } else if (status === 404) {
      errorObj.code = 'NOT_FOUND';
      errorObj.message = responseData.message || 'The requested resource was not found.';
    } else if (status === 422) {
      errorObj.code = 'VALIDATION_ERROR';
      errorObj.message = responseData.message || 'The submitted data is invalid.';
      errorObj.validationErrors = responseData.errors || {};
    } else if (status >= 500) {
      errorObj.code = 'SERVER_ERROR';
      errorObj.message = 'The server encountered an error. Please try again later.';
    }
  } else if (error.request) {
    // Request was made but no response received
    errorObj.code = 'NETWORK_ERROR';
    errorObj.message = 'Network error. Please check your connection and try again.';
  } else if (error instanceof ValidationError) {
    // Validation error
    errorObj.code = 'VALIDATION_ERROR';
    errorObj.message = error.message;
    errorObj.validationErrors = error.errors;
  } else if (error instanceof ApiError) {
    // API error
    errorObj.code = 'API_ERROR';
    errorObj.message = error.message;
    errorObj.status = error.status;
    errorObj.data = error.data;
  }
  
  // Track error if enabled
  if (opts.track) {
    trackError(errorObj.code, errorObj.message, {
      status: errorObj.status,
      url: error.config?.url
    });
  }
  
  return errorObj;
};

/**
 * Format API error message for display
 * @param {Object} error - Error object from handleApiError
 * @param {boolean} includeDetails - Whether to include technical details
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error, includeDetails = false) => {
  let message = error.message || 'An unexpected error occurred';
  
  if (includeDetails && process.env.NODE_ENV === 'development') {
    if (error.code) {
      message += ` (${error.code})`;
    }
    
    if (error.status) {
      message += ` [Status: ${error.status}]`;
    }
  }
  
  return message;
};

/**
 * Create a validation errors object from API response
 * @param {Object} apiError - Error from API
 * @returns {Object} Validation errors object
 */
export const createValidationErrors = (apiError) => {
  if (!apiError || !apiError.validationErrors) {
    return {};
  }
  
  return apiError.validationErrors;
};

/**
 * Check if an error is a network connectivity error
 * @param {Error} error - Error to check
 * @returns {boolean} True if it's a network error
 */
export const isNetworkError = (error) => {
  return (
    error.code === 'NETWORK_ERROR' ||
    error.message === 'Network Error' ||
    (error.response === undefined && error.request)
  );
};

/**
 * Check if an error is an authentication error
 * @param {Error} error - Error to check
 * @returns {boolean} True if it's an auth error
 */
export const isAuthError = (error) => {
  return (
    error.code === 'UNAUTHORIZED' ||
    (error.response && error.response.status === 401)
  );
};

/**
 * Check if an error is a validation error
 * @param {Error} error - Error to check
 * @returns {boolean} True if it's a validation error
 */
export const isValidationError = (error) => {
  return (
    error.code === 'VALIDATION_ERROR' ||
    error instanceof ValidationError ||
    (error.response && error.response.status === 422)
  );
};

/**
 * Get all validation error messages as an array
 * @param {Object} validationErrors - Validation errors object
 * @returns {Array} Array of error messages
 */
export const getValidationErrorMessages = (validationErrors) => {
  if (!validationErrors) {
    return [];
  }
  
  return Object.values(validationErrors).flat();
};

/**
 * Create a friendly error message for the user
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyError = (error) => {
  // Handle network errors
  if (isNetworkError(error)) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  // Handle auth errors
  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Handle validation errors
  if (isValidationError(error)) {
    const messages = getValidationErrorMessages(error.validationErrors);
    if (messages.length > 0) {
      return messages[0];
    }
    return 'The submitted information is invalid. Please check your inputs and try again.';
  }
  
  // Handle API errors with messages
  if (error.message) {
    return error.message;
  }
  
  // Default message
  return 'An unexpected error occurred. Please try again later.';
};

/**
 * Log error to the console and tracking system
 * @param {Error} error - Error to log
 * @param {string} context - Additional context
 */
export const logError = (error, context = '') => {
  console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  
  trackError(
    error.name || 'Error',
    error.message || 'Unknown error',
    {
      stack: error.stack,
      context
    }
  );
  
  return error;
};

/**
 * Safely parse JSON
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError(error, 'JSON parsing');
    return defaultValue;
  }
};
