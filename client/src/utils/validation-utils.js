/**
 * Utility functions for form validation
 */

/**
 * Validate an email address
 * @param {string} email - The email to validate
 * @returns {boolean} True if the email is valid
 */
export const isValidEmail = (email) => {
    if (!email) return false;
    // RFC 5322 compliant regex for email validation
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email.trim());
  };
  
  /**
   * Check if a string is empty or only whitespace
   * @param {string} str - The string to check
   * @returns {boolean} True if the string is empty or only whitespace
   */
  export const isEmpty = (str) => {
    if (str === null || str === undefined) return true;
    return str.trim() === '';
  };
  
  /**
   * Validate a password meets minimum requirements
   * @param {string} password - The password to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  export const validatePassword = (password, options = {}) => {
    const defaults = {
      minLength: 6,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    };
    
    const config = { ...defaults, ...options };
    const result = { 
      valid: true, 
      message: '',
      strength: 'weak' // weak, medium, strong
    };
    
    // Check minimum length
    if (!password || password.length < config.minLength) {
      result.valid = false;
      result.message = `Password must be at least ${config.minLength} characters`;
      return result;
    }
    
    // Check for uppercase letters
    if (config.requireUppercase && !/[A-Z]/.test(password)) {
      result.valid = false;
      result.message = 'Password must contain at least one uppercase letter';
      return result;
    }
    
    // Check for lowercase letters
    if (config.requireLowercase && !/[a-z]/.test(password)) {
      result.valid = false;
      result.message = 'Password must contain at least one lowercase letter';
      return result;
    }
    
    // Check for numbers
    if (config.requireNumbers && !/\d/.test(password)) {
      result.valid = false;
      result.message = 'Password must contain at least one number';
      return result;
    }
    
    // Check for special characters
    if (config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.valid = false;
      result.message = 'Password must contain at least one special character';
      return result;
    }
    
    // Determine password strength
    let strengthScore = 0;
    
    // Length contribution
    if (password.length >= 10) {
      strengthScore += 2;
    } else if (password.length >= 8) {
      strengthScore += 1;
    }
    
    // Character variety contribution
    if (/[A-Z]/.test(password)) strengthScore += 1;
    if (/[a-z]/.test(password)) strengthScore += 1;
    if (/\d/.test(password)) strengthScore += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore += 2;
    
    // Set strength based on score
    if (strengthScore >= 5) {
      result.strength = 'strong';
    } else if (strengthScore >= 3) {
      result.strength = 'medium';
    }
    
    return result;
  };
  
  /**
   * Validate if passwords match
   * @param {string} password - The password
   * @param {string} confirmPassword - The confirmation password
   * @returns {boolean} True if passwords match
   */
  export const passwordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };
  
  /**
   * Validate a URL
   * @param {string} url - The URL to validate
   * @returns {boolean} True if the URL is valid
   */
  export const isValidUrl = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Validate a phone number
   * @param {string} phone - The phone number to validate
   * @returns {boolean} True if the phone number is valid
   */
  export const isValidPhone = (phone) => {
    if (!phone) return false;
    // Basic phone validation - allows different formats
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.trim());
  };
  
  /**
   * Validate a credit card number using Luhn algorithm
   * @param {string} cardNumber - The card number to validate
   * @returns {boolean} True if the card number is valid
   */
  export const isValidCreditCard = (cardNumber) => {
    if (!cardNumber) return false;
    
    // Remove spaces and dashes
    const value = cardNumber.replace(/[\s-]/g, '');
    
    // Check if value contains only numbers
    if (!/^\d+$/.test(value)) return false;
    
    // Check length is between 13 and 19 digits
    if (value.length < 13 || value.length > 19) return false;
    
    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = value.length - 1; i >= 0; i--) {
      let digit = parseInt(value.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    return sum % 10 === 0;
  };
  
  /**
   * Validate form fields
   * @param {Object} values - Form values
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation errors
   */
  export const validateForm = (values, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const value = values[field];
      const fieldRules = rules[field];
      
      // Required validation
      if (fieldRules.required && isEmpty(value)) {
        errors[field] = fieldRules.requiredMessage || 'This field is required';
        return;
      }
      
      // Email validation
      if (fieldRules.email && !isEmpty(value) && !isValidEmail(value)) {
        errors[field] = fieldRules.emailMessage || 'Please enter a valid email address';
        return;
      }
      
      // Min length validation
      if (fieldRules.minLength && !isEmpty(value) && value.length < fieldRules.minLength) {
        errors[field] = fieldRules.minLengthMessage || 
          `Must be at least ${fieldRules.minLength} characters`;
        return;
      }
      
      // Max length validation
      if (fieldRules.maxLength && !isEmpty(value) && value.length > fieldRules.maxLength) {
        errors[field] = fieldRules.maxLengthMessage || 
          `Must be no more than ${fieldRules.maxLength} characters`;
        return;
      }
      
      // Custom validation
      if (fieldRules.validate && typeof fieldRules.validate === 'function') {
        const customError = fieldRules.validate(value, values);
        if (customError) {
          errors[field] = customError;
          return;
        }
      }
    });
    
    return errors;
  };
  
  /**
   * Check if a form has validation errors
   * @param {Object} errors - Validation errors object
   * @returns {boolean} True if there are errors
   */
  export const hasErrors = (errors) => {
    return Object.keys(errors).length > 0;
  };
  
  /**
   * Sanitize a string for safe display
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  export const sanitizeString = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };