// utils/notification-utils.js
/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  };
  
  /**
   * Create a notification object
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @param {number} duration - Duration in milliseconds
   * @returns {Object} - Notification object
   */
  export const createNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    return {
      id: Date.now(),
      message,
      type,
      duration
    };
  };
  
  /**
   * Format notification title based on type
   * @param {string} type - Notification type
   * @returns {string} - Title text
   */
  export const getNotificationTitle = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'Success';
      case NOTIFICATION_TYPES.ERROR:
        return 'Error';
      case NOTIFICATION_TYPES.WARNING:
        return 'Warning';
      default:
        return 'Information';
    }
  };
  
  /**
   * Format API response as a notification
   * @param {Object} response - API response
   * @returns {Object} - Notification object
   */
  export const createResponseNotification = (response) => {
    if (response.success) {
      return createNotification(
        response.message || 'Operation completed successfully', 
        NOTIFICATION_TYPES.SUCCESS
      );
    } else {
      return createNotification(
        response.error || 'Operation failed', 
        NOTIFICATION_TYPES.ERROR
      );
    }
  };