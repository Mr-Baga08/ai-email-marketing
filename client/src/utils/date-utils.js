/**
 * Utility functions for date and time formatting and manipulation
 */

/**
 * Format a date to a human-readable string
 * @param {Date|string|number} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj)) {
      return 'Invalid date';
    }
    
    const defaultOptions = {
      format: 'medium', // 'short', 'medium', 'long', 'full', 'relative'
      includeTime: false,
      timezone: undefined
    };
    
    const opts = { ...defaultOptions, ...options };
    
    if (opts.format === 'relative') {
      return formatRelativeDate(dateObj);
    }
    
    try {
      // Date formatting
      let dateFormatOptions = { timeZone: opts.timezone };
      
      switch (opts.format) {
        case 'short':
          dateFormatOptions = { 
            ...dateFormatOptions,
            month: 'numeric', 
            day: 'numeric', 
            year: '2-digit'
          };
          break;
        case 'medium':
          dateFormatOptions = { 
            ...dateFormatOptions,
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          };
          break;
        case 'long':
          dateFormatOptions = { 
            ...dateFormatOptions,
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
          };
          break;
        case 'full':
          dateFormatOptions = { 
            ...dateFormatOptions,
            weekday: 'long',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric'
          };
          break;
        default:
          dateFormatOptions = { 
            ...dateFormatOptions,
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          };
      }
      
      // Add time if required
      if (opts.includeTime) {
        dateFormatOptions = {
          ...dateFormatOptions,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
      }
      
      return new Intl.DateTimeFormat('en-US', dateFormatOptions).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(dateObj);
    }
  };
  
  /**
   * Format a date relative to the current time (e.g., "2 hours ago")
   * @param {Date} date - The date to format
   * @returns {string} Relative time string
   */
  export const formatRelativeDate = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);
    
    if (diffSec < 60) {
      return diffSec <= 5 ? 'just now' : `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else if (diffMonth < 12) {
      return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
    } else {
      return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
    }
  };
  
  /**
   * Format a date for API requests (ISO format)
   * @param {Date|string|number} date - The date to format
   * @returns {string} ISO formatted date string
   */
  export const formatDateForAPI = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  };
  
  /**
   * Get a date for a specified number of days from now
   * @param {number} days - Number of days from now (negative for past)
   * @returns {Date} Date object
   */
  export const getDateFromNow = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };
  
  /**
   * Parse a string date from the server
   * @param {string} dateString - The date string to parse
   * @returns {Date} Parsed Date object
   */
  export const parseDate = (dateString) => {
    return new Date(dateString);
  };
  
  /**
   * Check if a date is in the future
   * @param {Date|string|number} date - The date to check
   * @returns {boolean} True if the date is in the future
   */
  export const isFutureDate = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj > new Date();
  };
  
  /**
   * Check if a date is today
   * @param {Date|string|number} date - The date to check
   * @returns {boolean} True if the date is today
   */
  export const isToday = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    return dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear();
  };
  
  /**
   * Get current date and time as a formatted string
   * @returns {string} Current date and time
   */
  export const getCurrentDateTime = () => {
    return formatDate(new Date(), { includeTime: true, format: 'medium' });
  };
  
  /**
   * Add time to a date
   * @param {Date} date - The base date
   * @param {number} value - The amount to add
   * @param {string} unit - The unit (minutes, hours, days, weeks, months, years)
   * @returns {Date} The new date
   */
  export const addTimeToDate = (date, value, unit) => {
    const result = new Date(date);
    
    switch(unit.toLowerCase()) {
      case 'minute':
      case 'minutes':
        result.setMinutes(result.getMinutes() + value);
        break;
      case 'hour':
      case 'hours':
        result.setHours(result.getHours() + value);
        break;
      case 'day':
      case 'days':
        result.setDate(result.getDate() + value);
        break;
      case 'week':
      case 'weeks':
        result.setDate(result.getDate() + (value * 7));
        break;
      case 'month':
      case 'months':
        result.setMonth(result.getMonth() + value);
        break;
      case 'year':
      case 'years':
        result.setFullYear(result.getFullYear() + value);
        break;
      default:
        console.warn(`Unknown time unit: ${unit}`);
    }
    
    return result;
  };
  
  /**
   * Format a time duration in a human-readable way
   * @param {number} milliseconds - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  export const formatDuration = (milliseconds) => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s` 
        : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m` 
      : `${hours}h`;
  };