/**
 * Utility functions specific to email operations
 */
import { formatDate } from './date-utils';

/**
 * Extract placeholders from an email template
 * @param {string} template - Email template text
 * @returns {Array} Array of placeholder keys
 */
export const extractPlaceholders = (template) => {
  if (!template) return [];
  
  const placeholderRegex = /{([^{}]+)}/g;
  const matches = template.match(placeholderRegex) || [];
  
  // Extract the keys without the braces
  return matches.map(match => match.slice(1, -1));
};

/**
 * Replace placeholders in an email template with values
 * @param {string} template - Email template with placeholders
 * @param {Object} data - Object with values to replace placeholders
 * @returns {string} Processed template
 */
export const replacePlaceholders = (template, data) => {
  if (!template) return '';
  if (!data) return template;
  
  let result = template;
  
  // Replace placeholders with values from data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{${key}}`, 'g');
    result = result.replace(placeholder, value || '');
  });
  
  // Remove any remaining placeholders
  result = result.replace(/{[^{}]+}/g, '');
  
  return result;
};

/**
 * Validate an email template for missing required placeholders
 * @param {string} template - Email template to validate
 * @param {Array} requiredPlaceholders - List of required placeholders
 * @returns {Object} Validation result
 */
export const validateEmailTemplate = (template, requiredPlaceholders = []) => {
  if (!template) {
    return {
      valid: false,
      message: 'Email template is required'
    };
  }
  
  // Extract all placeholders from the template
  const placeholders = extractPlaceholders(template);
  
  // Check for required placeholders
  const missingPlaceholders = requiredPlaceholders.filter(
    placeholder => !placeholders.includes(placeholder)
  );
  
  if (missingPlaceholders.length > 0) {
    return {
      valid: false,
      message: `Missing required placeholders: ${missingPlaceholders.join(', ')}`,
      missingPlaceholders
    };
  }
  
  return {
    valid: true,
    message: 'Email template is valid',
    placeholders
  };
};

/**
 * Generate a preview of an email with sample data
 * @param {string} template - Email template
 * @param {Object} data - Sample data
 * @returns {string} Email preview
 */
export const generateEmailPreview = (template, data) => {
  // Extract all placeholders from the template
  const placeholders = extractPlaceholders(template);
  
  // Create sample data for any missing placeholders
  const sampleData = { ...data };
  
  placeholders.forEach(placeholder => {
    if (sampleData[placeholder] === undefined) {
      // Generate a sample value based on the placeholder name
      sampleData[placeholder] = generateSampleValue(placeholder);
    }
  });
  
  // Replace placeholders with sample data
  return replacePlaceholders(template, sampleData);
};

/**
 * Generate a sample value for a placeholder based on its name
 * @param {string} placeholder - Placeholder name
 * @returns {string} Sample value
 */
const generateSampleValue = (placeholder) => {
  const lowerPlaceholder = placeholder.toLowerCase();
  
  // Common placeholder patterns
  if (lowerPlaceholder.includes('name')) {
    if (lowerPlaceholder.includes('first')) return 'John';
    if (lowerPlaceholder.includes('last')) return 'Doe';
    return 'John Doe';
  }
  
  if (lowerPlaceholder.includes('email')) return 'john.doe@example.com';
  if (lowerPlaceholder.includes('company')) return 'Acme Inc.';
  if (lowerPlaceholder.includes('position') || lowerPlaceholder.includes('title')) return 'CEO';
  if (lowerPlaceholder.includes('phone')) return '(555) 123-4567';
  if (lowerPlaceholder.includes('date')) return formatDate(new Date());
  if (lowerPlaceholder.includes('price') || lowerPlaceholder.includes('cost')) return '$99.99';
  if (lowerPlaceholder.includes('percent')) return '20%';
  
  // Default for unknown placeholders
  return `[${placeholder}]`;
};

/**
 * Extract email address from a formatted email string
 * @param {string} emailString - Email string (e.g., "John Doe <john@example.com>")
 * @returns {string} Email address only
 */
export const extractEmailAddress = (emailString) => {
  if (!emailString) return '';
  
  // Check if the string has the format "Name <email>"
  const match = emailString.match(/<([^>]*)>/);
  if (match) {
    return match[1];
  }
  
  // Otherwise, assume it's just an email address
  return emailString.trim();
};

/**
 * Extract name from a formatted email string
 * @param {string} emailString - Email string (e.g., "John Doe <john@example.com>")
 * @returns {string} Name part only
 */
export const extractNameFromEmail = (emailString) => {
  if (!emailString) return '';
  
  // Check if the string has the format "Name <email>"
  const match = emailString.match(/^([^<]+)</);
  if (match) {
    return match[1].trim();
  }
  
  // Otherwise, return empty string
  return '';
};

/**
 * Parse a comma-separated list of emails
 * @param {string} emailList - Comma-separated email list
 * @returns {Array} Array of email addresses
 */
export const parseEmailList = (emailList) => {
  if (!emailList) return [];
  
  return emailList
    .split(',')
    .map(email => extractEmailAddress(email.trim()))
    .filter(email => email); // Remove empty entries
};

/**
 * Validate a list of email addresses
 * @param {Array} emails - Array of email addresses
 * @returns {Object} Validation result with valid and invalid emails
 */
export const validateEmailList = (emails) => {
  if (!emails || !Array.isArray(emails)) {
    return {
      valid: false,
      validEmails: [],
      invalidEmails: []
    };
  }
  
  const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  
  const validEmails = [];
  const invalidEmails = [];
  
  emails.forEach(email => {
    if (emailRegex.test(email.trim())) {
      validEmails.push(email.trim());
    } else {
      invalidEmails.push(email.trim());
    }
  });
  
  return {
    valid: invalidEmails.length === 0,
    validEmails,
    invalidEmails
  };
};

/**
 * Calculate estimated email size in KB
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @returns {number} Approximate size in KB
 */
export const estimateEmailSize = (subject, body) => {
  // Basic approximation: 1 byte per character + headers
  const headerSize = 2 * 1024; // Approximate header size: 2KB
  const contentSize = (subject?.length || 0) + (body?.length || 0);
  
  // Convert to KB and round up
  return Math.ceil((headerSize + contentSize) / 1024);
};

/**
 * Sanitize HTML for email body
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 */
export const sanitizeEmailHtml = (html) => {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes
  return html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags and content
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove onX event handlers
    .replace(/ on\w+="[^"]*"/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:[^\s"']+/gi, '')
    // Remove data: URLs
    .replace(/data:[^\s"']+/gi, '');
};

/**
 * Convert HTML email to plain text
 * @param {string} html - HTML email content
 * @returns {string} Plain text version
 */
export const htmlToPlainText = (html) => {
  if (!html) return '';
  
  return html
    // Replace line breaks with newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '* ')
    .replace(/<\/li>/gi, '\n')
    // Remove all other HTML tags
    .replace(/<[^>]*>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, '\'')
    // Fix spacing
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Generate a random email template ID
 * @returns {string} Template ID
 */
export const generateTemplateId = () => {
  return `template_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

/**
 * Parse email metadata from headers
 * @param {Object} headers - Email headers
 * @returns {Object} Parsed metadata
 */
export const parseEmailMetadata = (headers) => {
  if (!headers) return {};
  
  return {
    messageId: headers['message-id'] || headers['x-message-id'],
    campaignId: headers['x-campaign-id'],
    references: headers.references,
    inReplyTo: headers['in-reply-to'],
    date: headers.date
  };
};

/**
 * Generate default email signature
 * @param {Object} user - User data
 * @returns {string} HTML signature
 */
export const generateEmailSignature = (user) => {
  if (!user) return '';
  
  return `
<div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #eee;">
  <p style="margin: 0; font-size: 14px;">
    <strong>${user.name}</strong>
    ${user.title ? `<br>${user.title}` : ''}
    ${user.company ? `<br>${user.company}` : ''}
  </p>
  ${user.email ? `<p style="margin: 5px 0; font-size: 14px;">${user.email}</p>` : ''}
  ${user.phone ? `<p style="margin: 5px 0; font-size: 14px;">${user.phone}</p>` : ''}
</div>
  `.trim();
};
