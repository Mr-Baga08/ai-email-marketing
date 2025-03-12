// server/utils/validators.js

/**
 * Validation helper functions for request data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
    if (!email) return false;
    
    // Simple regex for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validate password meets requirements
   * @param {string} password - Password to validate
   * @returns {object} Validation result with isValid and message
   */
  const validatePassword = (password) => {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' };
    }
    
    // Optional: Check for password complexity requirements
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!(hasLowercase && hasUppercase && hasNumber && hasSpecialChar)) {
      return { 
        isValid: false, 
        message: 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      };
    }
    
    return { isValid: true, message: '' };
  };
  
  /**
   * Validate user registration input
   * @param {object} userData - User registration data
   * @returns {object} Validation errors object
   */
  const validateUserRegistration = (userData) => {
    const errors = {};
    
    // Check name
    if (!userData.name || userData.name.trim() === '') {
      errors.name = 'Name is required';
    }
    
    // Check email
    if (!userData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(userData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Check password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message;
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate login input
   * @param {object} loginData - Login credentials
   * @returns {object} Validation errors object
   */
  const validateLogin = (loginData) => {
    const errors = {};
    
    // Check email
    if (!loginData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(loginData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Check password
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate campaign data
   * @param {object} campaignData - Campaign data
   * @returns {object} Validation errors object
   */
  const validateCampaign = (campaignData) => {
    const errors = {};
    
    // Check name
    if (!campaignData.name || campaignData.name.trim() === '') {
      errors.name = 'Campaign name is required';
    }
    
    // Check subject
    if (!campaignData.subject || campaignData.subject.trim() === '') {
      errors.subject = 'Email subject is required';
    }
    
    // Check content
    if (!campaignData.content || campaignData.content.trim() === '') {
      errors.content = 'Email content is required';
    }
    
    // Check sender name
    if (!campaignData.senderName || campaignData.senderName.trim() === '') {
      errors.senderName = 'Sender name is required';
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate contact list data
   * @param {object} listData - Contact list data
   * @returns {object} Validation errors object
   */
  const validateContactList = (listData) => {
    const errors = {};
    
    // Check name
    if (!listData.name || listData.name.trim() === '') {
      errors.name = 'List name is required';
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate contact data
   * @param {object} contactData - Contact data
   * @returns {object} Validation errors object
   */
  const validateContact = (contactData) => {
    const errors = {};
    
    // Check email
    if (!contactData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(contactData.email)) {
      errors.email = 'Email is invalid';
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate email credentials
   * @param {object} credentialsData - Email credentials
   * @returns {object} Validation errors object
   */
  const validateEmailCredentials = (credentialsData) => {
    const errors = {};
    
    // Check provider is selected
    if (!credentialsData.provider) {
      errors.provider = 'Email provider is required';
    }
    
    // For non-OAuth providers, check credentials
    if (credentialsData.provider !== 'gmail' && credentialsData.provider !== 'outlook') {
      // Check email
      if (!credentialsData.credentials.email) {
        errors.email = 'Email is required';
      } else if (!isValidEmail(credentialsData.credentials.email)) {
        errors.email = 'Email is invalid';
      }
      
      // Check password
      if (!credentialsData.credentials.password) {
        errors.password = 'Password is required';
      }
      
      // Check server details for custom provider
      if (credentialsData.provider === 'other') {
        if (!credentialsData.credentials.server) {
          errors.server = 'SMTP Server is required';
        }
        
        if (!credentialsData.credentials.port) {
          errors.port = 'Port is required';
        } else if (isNaN(parseInt(credentialsData.credentials.port))) {
          errors.port = 'Port must be a number';
        }
      }
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate subscription plan
   * @param {object} planData - Subscription plan data
   * @returns {object} Validation errors object
   */
  const validateSubscriptionPlan = (planData) => {
    const errors = {};
    
    // Check plan
    if (!planData.plan) {
      errors.plan = 'Subscription plan is required';
    } else {
      const validPlans = ['free', 'basic', 'premium', 'enterprise'];
      if (!validPlans.includes(planData.plan)) {
        errors.plan = 'Invalid subscription plan';
      }
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  /**
   * Validate knowledge base entry
   * @param {object} entryData - Knowledge base entry data
   * @returns {object} Validation errors object
   */
  const validateKnowledgeBaseEntry = (entryData) => {
    const errors = {};
    
    // Check content
    if (!entryData.content || entryData.content.trim() === '') {
      errors.content = 'Content is required';
    }
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  };
  
  module.exports = {
    isValidEmail,
    validatePassword,
    validateUserRegistration,
    validateLogin,
    validateCampaign,
    validateContactList,
    validateContact,
    validateEmailCredentials,
    validateSubscriptionPlan,
    validateKnowledgeBaseEntry
  };