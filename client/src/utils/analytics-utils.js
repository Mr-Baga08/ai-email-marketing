/**
 * Utility functions for analytics and tracking
 */

// Default event categories
const EVENT_CATEGORIES = {
  EMAIL: 'email',
  CAMPAIGN: 'campaign',
  CONTACT: 'contact',
  AUTOMATION: 'automation',
  USER: 'user',
  SUBSCRIPTION: 'subscription',
  NAVIGATION: 'navigation',
  AUTHENTICATION: 'auth'
};

// Track page views
export const trackPageView = (path, title) => {
  try {
    // Google Analytics tracking if available
    if (window.gtag) {
      window.gtag('config', process.env.REACT_APP_GA_TRACKING_ID, {
        page_path: path,
        page_title: title
      });
    }
    
    // Custom application analytics (can be implemented to send to backend)
    logAnalyticsEvent('page_view', {
      path,
      title,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking page view:', error);
    return false;
  }
};

/**
 * Track an event
 * @param {string} category - Event category
 * @param {string} action - Event action
 * @param {Object} params - Additional event parameters
 */
export const trackEvent = (category, action, params = {}) => {
  try {
    // Google Analytics event tracking
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        ...params
      });
    } 
    
    // Custom application analytics
    logAnalyticsEvent(action, {
      category,
      ...params,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error tracking event:', error);
    return false;
  }
};

/**
 * Track email campaign metrics
 * @param {string} campaignId - Campaign ID
 * @param {string} action - Action (sent, opened, clicked)
 * @param {Object} metadata - Additional metadata
 */
export const trackEmailCampaign = (campaignId, action, metadata = {}) => {
  return trackEvent(EVENT_CATEGORIES.CAMPAIGN, action, {
    campaign_id: campaignId,
    ...metadata
  });
};

/**
 * Track user authentication events
 * @param {string} action - Auth action (login, register, logout)
 * @param {Object} metadata - Additional metadata
 */
export const trackAuth = (action, metadata = {}) => {
  return trackEvent(EVENT_CATEGORIES.AUTHENTICATION, action, metadata);
};

/**
 * Track subscription events
 * @param {string} action - Subscription action (created, updated, canceled)
 * @param {string} plan - Subscription plan
 * @param {Object} metadata - Additional metadata
 */
export const trackSubscription = (action, plan, metadata = {}) => {
  return trackEvent(EVENT_CATEGORIES.SUBSCRIPTION, action, {
    plan,
    ...metadata
  });
};

/**
 * Track user actions with AI features
 * @param {string} feature - AI feature name
 * @param {string} action - Action performed
 * @param {Object} metadata - Additional metadata
 */
export const trackAIUsage = (feature, action, metadata = {}) => {
  return trackEvent('ai', action, {
    feature,
    ...metadata
  });
};

/**
 * Track API performance
 * @param {string} endpoint - API endpoint
 * @param {number} responseTime - Response time in milliseconds
 * @param {boolean} success - Whether the request was successful
 */
export const trackApiPerformance = (endpoint, responseTime, success) => {
  return trackEvent('api_performance', 'request', {
    endpoint,
    response_time: responseTime,
    success
  });
};

/**
 * Track feature usage
 * @param {string} feature - Feature name
 * @param {string} action - Action performed
 * @param {Object} metadata - Additional metadata
 */
export const trackFeatureUsage = (feature, action, metadata = {}) => {
  return trackEvent('feature', action, {
    feature,
    ...metadata
  });
};

/**
 * Track errors
 * @param {string} errorType - Type of error
 * @param {string} message - Error message
 * @param {Object} metadata - Additional metadata
 */
export const trackError = (errorType, message, metadata = {}) => {
  return trackEvent('error', errorType, {
    message,
    ...metadata
  });
};

/**
 * Queue analytics events for batch processing
 * @param {Object} eventData - Event data
 */
const eventQueue = [];

/**
 * Log analytics event (internal function)
 * @param {string} action - Event action
 * @param {Object} data - Event data
 */
function logAnalyticsEvent(action, data) {
  // Add event to queue
  eventQueue.push({
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  // Process queue if it gets too large
  if (eventQueue.length >= 10) {
    processEventQueue();
  }
}

/**
 * Process queued events (sends to backend)
 */
export const processEventQueue = async () => {
  if (eventQueue.length === 0) return;
  
  // Clone and clear the queue
  const events = [...eventQueue];
  eventQueue.length = 0;
  
  try {
    // Send events to backend (implementation depends on your API)
    // This is just a placeholder - replace with actual API call
    if (process.env.NODE_ENV !== 'development') {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events })
      });
    } else {
      // In development, just log to console
      console.log('Analytics events:', events);
    }
  } catch (error) {
    console.error('Error sending analytics events:', error);
    // Put events back in queue
    eventQueue.push(...events);
  }
};

// Process queue before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', processEventQueue);
}

/**
 * Calculate email campaign metrics
 * @param {Object} campaign - Campaign data
 * @returns {Object} Calculated metrics
 */
export const calculateCampaignMetrics = (campaign) => {
  const total = campaign.stats?.total || 0;
  
  if (total === 0) {
    return {
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0
    };
  }
  
  const opens = campaign.stats?.opened || 0;
  const clicks = campaign.stats?.clicked || 0;
  const bounces = campaign.stats?.bounced || 0;
  const unsubscribes = campaign.stats?.unsubscribed || 0;
  
  return {
    openRate: (opens / total) * 100,
    clickRate: (clicks / total) * 100,
    bounceRate: (bounces / total) * 100,
    unsubscribeRate: (unsubscribes / total) * 100
  };
};

/**
 * Get user retention metrics
 * @param {Array} users - User data
 * @returns {Object} Retention metrics
 */
export const calculateRetentionMetrics = (users) => {
  // Implementation would depend on your user data structure
  // This is just a placeholder
  return {
    day1: 0,
    day7: 0,
    day30: 0
  };
};

/**
 * Initialize analytics
 * @param {string} userId - User ID for tracking
 */
export const initializeAnalytics = (userId) => {
  if (window.gtag) {
    window.gtag('set', 'user_id', userId);
  }
  
  // Set up other analytics configurations
  return true;
};

// Export event categories for use in components
export { EVENT_CATEGORIES };
