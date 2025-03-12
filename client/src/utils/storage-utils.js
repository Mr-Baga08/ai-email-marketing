/**
 * Utility functions for local storage and session storage management
 */

/**
 * Save data to localStorage with optional expiration
 * @param {string} key - Storage key
 * @param {*} value - Data to store
 * @param {number} expirationHours - Hours until expiration (optional)
 */
export const setLocalStorage = (key, value, expirationHours = null) => {
  try {
    const item = {
      value: value
    };
    
    // Add expiration if specified
    if (expirationHours) {
      const now = new Date();
      item.expiry = now.getTime() + (expirationHours * 60 * 60 * 1000);
    }
    
    localStorage.setItem(key, JSON.stringify(item));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

/**
 * Get data from localStorage, respecting expiration
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const itemStr = localStorage.getItem(key);
    
    // Return default if not found
    if (!itemStr) {
      return defaultValue;
    }
    
    const item = JSON.parse(itemStr);
    
    // Check for expiration
    if (item.expiry && new Date().getTime() > item.expiry) {
      localStorage.removeItem(key);
      return defaultValue;
    }
    
    return item.value;
  } catch (error) {
    console.error('Error retrieving from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

/**
 * Save data to sessionStorage
 * @param {string} key - Storage key
 * @param {*} value - Data to store
 */
export const setSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
    return false;
  }
};

/**
 * Get data from sessionStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export const getSessionStorage = (key, defaultValue = null) => {
  try {
    const itemStr = sessionStorage.getItem(key);
    
    // Return default if not found
    if (!itemStr) {
      return defaultValue;
    }
    
    return JSON.parse(itemStr);
  } catch (error) {
    console.error('Error retrieving from sessionStorage:', error);
    return defaultValue;
  }
};

/**
 * Remove item from sessionStorage
 * @param {string} key - Storage key
 */
export const removeSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from sessionStorage:', error);
    return false;
  }
};

/**
 * Clear all localStorage data for the application
 * @param {string} prefix - Optional key prefix to limit what gets cleared
 */
export const clearLocalStorage = (prefix = '') => {
  try {
    if (!prefix) {
      localStorage.clear();
      return true;
    }
    
    // Clear only items with the given prefix
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Clear all sessionStorage data for the application
 * @param {string} prefix - Optional key prefix to limit what gets cleared
 */
export const clearSessionStorage = (prefix = '') => {
  try {
    if (!prefix) {
      sessionStorage.clear();
      return true;
    }
    
    // Clear only items with the given prefix
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
    return false;
  }
};

/**
 * Get the total size of data stored in localStorage
 * @returns {number} Size in bytes
 */
export const getLocalStorageSize = () => {
  try {
    let totalSize = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }
    
    return totalSize * 2; // UTF-16 characters are 2 bytes each
  } catch (error) {
    console.error('Error calculating localStorage size:', error);
    return 0;
  }
};

/**
 * Check if localStorage is available and working
 * @returns {boolean} True if localStorage is available
 */
export const isLocalStorageAvailable = () => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Store user preferences
 * @param {Object} preferences - User preferences object
 */
export const saveUserPreferences = (preferences) => {
  setLocalStorage('user_preferences', preferences);
};

/**
 * Get user preferences
 * @returns {Object} User preferences
 */
export const getUserPreferences = () => {
  return getLocalStorage('user_preferences', {});
};

/**
 * Save draft email content
 * @param {string} campaignId - Campaign ID
 * @param {Object} data - Draft data
 */
export const saveEmailDraft = (campaignId, data) => {
  const key = `email_draft_${campaignId}`;
  setLocalStorage(key, data);
};

/**
 * Get draft email content
 * @param {string} campaignId - Campaign ID
 * @returns {Object} Draft data
 */
export const getEmailDraft = (campaignId) => {
  const key = `email_draft_${campaignId}`;
  return getLocalStorage(key, null);
};

/**
 * Check if there's a saved draft
 * @param {string} campaignId - Campaign ID
 * @returns {boolean} True if a draft exists
 */
export const hasSavedDraft = (campaignId) => {
  const key = `email_draft_${campaignId}`;
  return getLocalStorage(key) !== null;
};

/**
 * Save the last visited page
 * @param {string} path - Page path
 */
export const saveLastVisitedPage = (path) => {
  setLocalStorage('last_page', path);
};

/**
 * Get the last visited page
 * @returns {string} Page path
 */
export const getLastVisitedPage = () => {
  return getLocalStorage('last_page', '/dashboard');
};
