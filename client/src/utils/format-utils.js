/**
 * Utility functions for text formatting and manipulation
 */

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param {string} text - The text to truncate
 * @param {number} length - Maximum length
 * @param {string} ellipsis - String to add at the end if truncated
 * @returns {string} Truncated string
 */
export const truncateText = (text, length = 100, ellipsis = '...') => {
    if (!text) return '';
    if (text.length <= length) return text;
    
    return text.substring(0, length).trim() + ellipsis;
  };
  
  /**
   * Format a number as a percentage
   * @param {number} value - The value to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage
   */
  export const formatPercent = (value, decimals = 1) => {
    if (value === null || value === undefined) return '0%';
    return `${parseFloat(value).toFixed(decimals)}%`;
  };
  
  /**
   * Format a number with thousand separators
   * @param {number} num - The number to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted number
   */
  export const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  /**
   * Format a currency value
   * @param {number} amount - The amount to format
   * @param {string} currency - Currency code (e.g., 'USD')
   * @param {string} locale - Locale string (e.g., 'en-US')
   * @returns {string} Formatted currency
   */
  export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  /**
   * Format a file size in a human-readable way
   * @param {number} bytes - Size in bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted file size
   */
  export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };
  
  /**
   * Strip HTML tags from a string
   * @param {string} html - HTML string
   * @returns {string} Plain text
   */
  export const stripHtml = (html) => {
    if (!html) return '';
    
    // Create a DOM element to safely strip HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };
  
  /**
   * Convert plain text to HTML with line breaks
   * @param {string} text - Plain text
   * @returns {string} HTML with line breaks
   */
  export const textToHtml = (text) => {
    if (!text) return '';
    
    // Replace line breaks with <br> and escape HTML special characters
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  };
  
  /**
   * Extract excerpt from HTML content
   * @param {string} html - HTML content
   * @param {number} length - Maximum length
   * @returns {string} Plain text excerpt
   */
  export const extractExcerpt = (html, length = 150) => {
    if (!html) return '';
    
    const text = stripHtml(html);
    return truncateText(text, length);
  };
  
  /**
   * Capitalize the first letter of a string
   * @param {string} str - Input string
   * @returns {string} String with first letter capitalized
   */
  export const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  
  /**
   * Capitalize the first letter of each word in a string
   * @param {string} str - Input string
   * @returns {string} String with each word capitalized
   */
  export const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  /**
   * Convert a string to sentence case
   * @param {string} str - Input string
   * @returns {string} String in sentence case
   */
  export const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  /**
   * Convert a string to camel case
   * @param {string} str - Input string
   * @returns {string} String in camel case
   */
  export const toCamelCase = (str) => {
    if (!str) return '';
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, '');
  };
  
  /**
   * Convert a string to kebab case (dash-separated)
   * @param {string} str - Input string
   * @returns {string} String in kebab case
   */
  export const toKebabCase = (str) => {
    if (!str) return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };
  
  /**
   * Convert a string to snake case (underscore_separated)
   * @param {string} str - Input string
   * @returns {string} String in snake case
   */
  export const toSnakeCase = (str) => {
    if (!str) return '';
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  };
  
  /**
   * Format an email address with a name
   * @param {string} email - Email address
   * @param {string} name - Name to associate with the email
   * @returns {string} Formatted email string
   */
  export const formatEmailWithName = (email, name) => {
    if (!email) return '';
    if (!name) return email;
    return `${name} <${email}>`;
  };
  
  /**
   * Format a phone number
   * @param {string} phoneNumber - Raw phone number
   * @param {string} format - Format pattern (e.g., 'XXX-XXX-XXXX')
   * @returns {string} Formatted phone number
   */
  export const formatPhoneNumber = (phoneNumber, format = 'XXX-XXX-XXXX') => {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Use the specified format
    let formatted = format;
    let digitIndex = 0;
    
    for (let i = 0; i < formatted.length && digitIndex < digits.length; i++) {
      if (formatted.charAt(i) === 'X') {
        formatted = formatted.substring(0, i) + digits.charAt(digitIndex++) + formatted.substring(i + 1);
      }
    }
    
    // Remove any remaining X placeholders
    formatted = formatted.replace(/X/g, '');
    
    return formatted;
  };
  
  /**
   * Format bytes for email size display
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size for email display
   */
  export const formatEmailSize = (bytes) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(0) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };
  
  /**
   * Extract domain from an email address
   * @param {string} email - Email address
   * @returns {string} Domain
   */
  export const getEmailDomain = (email) => {
    if (!email || !email.includes('@')) return '';
    return email.split('@')[1];
  };
  
  /**
   * Highlight search terms in a text
   * @param {string} text - Original text
   * @param {string} query - Search query
   * @param {string} highlightClass - CSS class for highlighting
   * @returns {string} HTML with highlighted terms
   */
  export const highlightSearchTerms = (text, query, highlightClass = 'highlight') => {
    if (!text || !query) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
  };