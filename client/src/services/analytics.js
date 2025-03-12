// src/services/analytics.js
import axios from 'axios';

// Initialize tracking constants
const TRACKING_ENDPOINT = '/api/analytics';
const SESSION_ID = generateSessionId();
const ANALYTICS_ENABLED = process.env.REACT_APP_ANALYTICS_ENABLED !== 'false';

/**
 * Generate a unique session ID for tracking
 */
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Initialize analytics
 * @param {Object} options - Configuration options 
 */
export function initialize(options = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  // Set up page view tracking
  trackPageView();
  
  // Set up automatic event tracking if enabled
  if (options.autoTrack !== false) {
    setupAutoTracking();
  }
  
  // Log initialization
  console.log('Analytics initialized with session:', SESSION_ID);
}

/**
 * Track page view
 * @param {string} pagePath - Optional custom page path
 */
export function trackPageView(pagePath) {
  if (!ANALYTICS_ENABLED) return;
  
  const path = pagePath || window.location.pathname;
  
  // Send page view data
  sendAnalyticsEvent('page_view', {
    page_path: path,
    page_title: document.title,
    page_url: window.location.href
  });
  
  // Also track in Google Analytics if available
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href
    });
  }
}

/**
 * Track user event
 * @param {string} eventName - Name of the event
 * @param {Object} eventParams - Additional parameters
 */
export function trackEvent(eventName, eventParams = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent(eventName, eventParams);
  
  // Also track in Google Analytics if available
  if (window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

/**
 * Track campaign performance
 * @param {string} campaignId - Campaign ID
 * @param {string} metricName - Metric name (sent, opened, clicked, etc.)
 * @param {Object} additionalData - Additional campaign data
 */
export function trackCampaignMetric(campaignId, metricName, additionalData = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('campaign_metric', {
    campaign_id: campaignId,
    metric: metricName,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
}

/**
 * Track email interactions
 * @param {string} emailId - Email ID
 * @param {string} interactionType - Type of interaction (open, click, etc.)
 * @param {Object} metadata - Additional interaction data
 */
export function trackEmailInteraction(emailId, interactionType, metadata = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('email_interaction', {
    email_id: emailId,
    interaction_type: interactionType,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

/**
 * Track user conversion
 * @param {string} conversionType - Type of conversion
 * @param {number} value - Value of the conversion
 * @param {Object} metadata - Additional conversion data
 */
export function trackConversion(conversionType, value = 0, metadata = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('conversion', {
    conversion_type: conversionType,
    value,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  
  // Also track in Google Analytics if available
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: process.env.REACT_APP_GA_CONVERSION_ID,
      value: value,
      ...metadata
    });
  }
}

/**
 * Track AI feature usage
 * @param {string} featureType - Type of AI feature
 * @param {Object} usageData - Details about the usage
 */
export function trackAIUsage(featureType, usageData = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('ai_usage', {
    feature_type: featureType,
    timestamp: new Date().toISOString(),
    ...usageData
  });
}

/**
 * Track errors
 * @param {string} errorType - Type of error
 * @param {string} errorMessage - Error message
 * @param {Object} metadata - Additional error data
 */
export function trackError(errorType, errorMessage, metadata = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('error', {
    error_type: errorType,
    error_message: errorMessage,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}

/**
 * Track feature usage
 * @param {string} featureName - Name of the feature
 * @param {Object} usageData - Feature usage data
 */
export function trackFeatureUsage(featureName, usageData = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('feature_usage', {
    feature_name: featureName,
    timestamp: new Date().toISOString(),
    ...usageData
  });
}

/**
 * Track subscription events
 * @param {string} actionType - Type of subscription action
 * @param {string} planName - Name of the plan
 * @param {Object} metadata - Additional subscription data
 */
export function trackSubscription(actionType, planName, metadata = {}) {
  if (!ANALYTICS_ENABLED) return;
  
  sendAnalyticsEvent('subscription', {
    action_type: actionType, // 'new', 'upgrade', 'downgrade', 'cancel', etc.
    plan_name: planName,
    timestamp: new Date().toISOString(),
    ...metadata
  });
  
  // Also track as conversion for paid plans
  if (actionType === 'new' || actionType === 'upgrade') {
    trackConversion('subscription', metadata.price || 0, { plan_name: planName });
  }
}

/**
 * Send analytics event to the server
 * @param {string} eventName - Name of the event
 * @param {Object} eventData - Event data
 */
function sendAnalyticsEvent(eventName, eventData = {}) {
  // Add common properties to all events
  const eventPayload = {
    event_name: eventName,
    session_id: SESSION_ID,
    user_id: getUserId(),
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    screen_size: `${window.innerWidth}x${window.innerHeight}`,
    ...eventData
  };
  
  // Queue the event to be sent
  queueEvent(eventPayload);
}

// Event queue to batch analytics events
const eventQueue = [];
let queueTimer = null;

/**
 * Queue an event to be sent in batch
 * @param {Object} eventPayload - Event data
 */
function queueEvent(eventPayload) {
  eventQueue.push(eventPayload);
  
  // If this is the first event in the queue, set up the timer
  if (eventQueue.length === 1) {
    queueTimer = setTimeout(flushEventQueue, 2000); // Flush every 2 seconds
  }
  
  // If the queue gets too large, flush immediately
  if (eventQueue.length >= 10) {
    clearTimeout(queueTimer);
    flushEventQueue();
  }
}

/**
 * Send queued events to the analytics endpoint
 */
function flushEventQueue() {
  if (eventQueue.length === 0) return;
  
  const events = [...eventQueue];
  eventQueue.length = 0; // Clear the queue
  
  // Send events to backend
  axios.post(TRACKING_ENDPOINT, { events })
    .catch(error => {
      console.error('Error sending analytics data:', error);
      
      // Store failed events in localStorage for retry later
      const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
      localStorage.setItem('failedAnalyticsEvents', JSON.stringify([...failedEvents, ...events]));
    });
}

/**
 * Get the current user ID if logged in
 * @returns {string} User ID or 'anonymous'
 */
function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user._id ? user._id : 'anonymous';
  } catch (e) {
    return 'anonymous';
  }
}

/**
 * Set up automatic event tracking for common interactions
 */
function setupAutoTracking() {
  // Track clicks on buttons and links
  document.addEventListener('click', (e) => {
    const element = e.target.closest('button, a, [data-track]');
    if (!element) return;
    
    const trackingData = element.dataset.track;
    if (trackingData) {
      // If the element has explicit tracking data
      try {
        const data = JSON.parse(trackingData);
        trackEvent(data.event || 'click', data);
      } catch (err) {
        trackEvent('click', { element_type: element.tagName.toLowerCase(), tracking_id: trackingData });
      }
    } else if (element.tagName === 'A' && element.href) {
      // Track link clicks
      const isExternal = element.hostname !== window.location.hostname;
      trackEvent('link_click', {
        url: element.href,
        is_external: isExternal,
        link_text: element.innerText.trim().substring(0, 50)
      });
    } else if (element.tagName === 'BUTTON') {
      // Track button clicks
      trackEvent('button_click', {
        button_text: element.innerText.trim().substring(0, 50),
        button_id: element.id || 'unknown'
      });
    }
  });
  
  // Track form submissions
  document.addEventListener('submit', (e) => {
    const form = e.target;
    
    // Don't track password forms
    if (form.querySelector('input[type="password"]')) return;
    
    trackEvent('form_submit', {
      form_id: form.id || 'unknown',
      form_name: form.getAttribute('name') || 'unknown'
    });
  });
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // User left the page
      sendAnalyticsEvent('visibility_change', { state: 'hidden' });
    } else if (document.visibilityState === 'visible') {
      // User returned to the page
      sendAnalyticsEvent('visibility_change', { state: 'visible' });
    }
  });
  
  // Track window resize events (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sendAnalyticsEvent('window_resize', {
        screen_size: `${window.innerWidth}x${window.innerHeight}`
      });
    }, 500);
  });
}

// Retry sending failed events on page load
export function retryFailedEvents() {
  const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
  if (failedEvents.length === 0) return;
  
  // Clear the storage immediately to prevent duplicate retries
  localStorage.removeItem('failedAnalyticsEvents');
  
  // Send the failed events
  axios.post(TRACKING_ENDPOINT, { events: failedEvents })
    .catch(error => {
      console.error('Error re-sending failed analytics data:', error);
      // Store them again for next retry
      localStorage.setItem('failedAnalyticsEvents', JSON.stringify(failedEvents));
    });
}

// Export analytics service methods
const analyticsService = {
  initialize,
  trackPageView,
  trackEvent,
  trackCampaignMetric,
  trackEmailInteraction,
  trackConversion,
  trackAIUsage,
  trackError,
  trackFeatureUsage,
  trackSubscription,
  retryFailedEvents
};

export default analyticsService;