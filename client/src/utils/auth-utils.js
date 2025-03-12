/**
 * Utility functions for authentication and authorization
 */
import { jwtDecode } from 'jwt-decode';
import { 
  setLocalStorage, 
  getLocalStorage, 
  removeLocalStorage 
} from './storage-utils';

// Constants
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const EXPIRY_KEY = 'auth_expiry';

/**
 * Store authentication token and user data
 * @param {string} token - JWT token
 * @param {Object} userData - User data
 * @returns {boolean} Success status
 */
export const setAuthToken = (token, userData = null) => {
  try {
    if (!token) {
      removeLocalStorage(TOKEN_KEY);
      removeLocalStorage(USER_KEY);
      removeLocalStorage(EXPIRY_KEY);
      return true;
    }
    
    // Decode token to get expiration
    const decodedToken = jwtDecode(token);
    const expiryDate = decodedToken.exp ? new Date(decodedToken.exp * 1000) : null;
    
    // Store token and expiry
    setLocalStorage(TOKEN_KEY, token);
    
    if (expiryDate) {
      setLocalStorage(EXPIRY_KEY, expiryDate.toISOString());
    }
    
    // Store user data if provided
    if (userData) {
      setLocalStorage(USER_KEY, userData);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
};

/**
 * Get stored authentication token
 * @returns {string|null} Authentication token
 */
export const getAuthToken = () => {
  return getLocalStorage(TOKEN_KEY);
};

/**
 * Get stored user data
 * @returns {Object|null} User data
 */
export const getAuthUser = () => {
  return getLocalStorage(USER_KEY);
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  // Check if token is expired
  return !isTokenExpired();
};

/**
 * Check if token is expired
 * @returns {boolean} True if token is expired
 */
export const isTokenExpired = () => {
  const expiry = getLocalStorage(EXPIRY_KEY);
  if (!expiry) return false;
  
  return new Date(expiry) < new Date();
};

/**
 * Remove authentication data (logout)
 * @returns {boolean} Success status
 */
export const clearAuth = () => {
  try {
    removeLocalStorage(TOKEN_KEY);
    removeLocalStorage(USER_KEY);
    removeLocalStorage(EXPIRY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

/**
 * Get token expiration time
 * @returns {Date|null} Expiration date
 */
export const getTokenExpiration = () => {
  const expiry = getLocalStorage(EXPIRY_KEY);
  return expiry ? new Date(expiry) : null;
};

/**
 * Check if token will expire soon
 * @param {number} minutesThreshold - Minutes threshold
 * @returns {boolean} True if token will expire soon
 */
export const willTokenExpireSoon = (minutesThreshold = 5) => {
  const expiry = getTokenExpiration();
  if (!expiry) return false;
  
  const thresholdTime = new Date();
  thresholdTime.setMinutes(thresholdTime.getMinutes() + minutesThreshold);
  
  return expiry < thresholdTime;
};

/**
 * Check if user has a specific role
 * @param {string} role - Role to check
 * @returns {boolean} True if user has the role
 */
export const hasRole = (role) => {
  const user = getAuthUser();
  if (!user || !user.role) return false;
  
  // Check for exact role
  if (typeof user.role === 'string') {
    return user.role === role;
  }
  
  // Check in array of roles
  if (Array.isArray(user.role)) {
    return user.role.includes(role);
  }
  
  return false;
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has the permission
 */
export const hasPermission = (permission) => {
  const user = getAuthUser();
  if (!user || !user.permissions) return false;
  
  // Handle string or array permissions
  if (typeof user.permissions === 'string') {
    return user.permissions === permission;
  }
  
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }
  
  // Handle permissions object with keys
  if (typeof user.permissions === 'object') {
    return !!user.permissions[permission];
  }
  
  return false;
};

/**
 * Check if user has a specific subscription feature
 * @param {string} feature - Feature to check
 * @returns {boolean} True if user has the feature
 */
export const hasSubscriptionFeature = (feature) => {
  const user = getAuthUser();
  if (!user || !user.subscription) return false;
  
  // Check for AI Email Automation
  if (feature === 'aiEmailAutomation') {
    return !!user.subscription.aiEmailAutomation;
  }
  
  // Check regular features
  if (!user.subscription.features || !Array.isArray(user.subscription.features)) {
    return false;
  }
  
  return user.subscription.features.some(f => 
    (f.name === feature && f.active) || f === feature
  );
};

/**
 * Get user subscription plan
 * @returns {string|null} Subscription plan
 */
export const getSubscriptionPlan = () => {
  const user = getAuthUser();
  if (!user || !user.subscription) return null;
  
  return user.subscription.plan;
};

/**
 * Check if subscription is active
 * @returns {boolean} True if subscription is active
 */
export const isSubscriptionActive = () => {
  const user = getAuthUser();
  if (!user || !user.subscription) return false;
  
  return user.subscription.status === 'active';
};

/**
 * Check if email provider is connected
 * @returns {boolean} True if email provider is connected
 */
export const isEmailProviderConnected = () => {
  const user = getAuthUser();
  if (!user || !user.emailIntegration) return false;
  
  return user.emailIntegration.verified === true;
};

/**
 * Get email provider name
 * @returns {string|null} Email provider name
 */
export const getEmailProvider = () => {
  const user = getAuthUser();
  if (!user || !user.emailIntegration) return null;
  
  return user.emailIntegration.provider;
};

/**
 * Update stored user data
 * @param {Object} userData - Updated user data
 * @returns {Object} Updated user object
 */
export const updateStoredUserData = (userData) => {
  if (!userData) return null;
  
  const currentUser = getAuthUser();
  const updatedUser = { ...currentUser, ...userData };
  
  setLocalStorage(USER_KEY, updatedUser);
  return updatedUser;
};

/**
 * Get user's timezone preference
 * @returns {string} Timezone
 */
export const getUserTimezone = () => {
  const user = getAuthUser();
  if (!user || !user.settings || !user.settings.timezone) {
    // Default to browser timezone if user preference not set
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  
  return user.settings.timezone;
};
