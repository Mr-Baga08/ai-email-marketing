// utils/api-utils.js
import { getErrorMessage } from './error-utils';

/**
 * Handle API errors consistently
 * @param {Error} error - The error object
 * @param {Function} setError - Error state setter
 * @param {Function} setLoading - Loading state setter (optional)
 * @returns {string} - The error message
 */
export const handleApiError = (error, setError, setLoading = null) => {
  const message = getErrorMessage(error);
  
  if (setError) {
    setError(message);
  }
  
  if (setLoading) {
    setLoading(false);
  }
  
  return message;
};

/**
 * Convert query parameters to URL search params
 * @param {Object} params - The query parameters
 * @returns {string} - URL query string
 */
export const formatQueryParams = (params) => {
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, value);
    }
  });
  
  return urlParams.toString();
};

/**
 * Create pagination parameters
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {Object} filters - Additional filters
 * @returns {Object} - Query parameters
 */
export const createPaginationParams = (page = 1, limit = 10, filters = {}) => {
  return {
    page,
    limit,
    ...filters
  };
};