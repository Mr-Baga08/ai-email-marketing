import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create context
const NotificationContext = createContext(null);

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Default duration for notifications (ms)
const DEFAULT_DURATION = 5000;

/**
 * NotificationProvider component
 * Provides notification functionality throughout the application
 */
export const NotificationProvider = ({ children }) => {
  // State to store active notifications
  const [notifications, setNotifications] = useState([]);
  
  // Store timeout IDs to be able to clear them if needed
  const timeoutIds = useRef({});

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Type of notification (success, error, info, warning)
   * @param {number} duration - How long the notification should be visible (ms)
   * @returns {string} - ID of the created notification
   */
  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, duration = DEFAULT_DURATION) => {
    // Create a unique ID for this notification
    const id = uuidv4();
    
    // Add the new notification to state
    setNotifications(prevNotifications => [
      ...prevNotifications,
      { id, message, type, timestamp: Date.now() }
    ]);
    
    // Set a timeout to automatically dismiss the notification
    if (duration !== 0) {
      const timeoutId = setTimeout(() => {
        dismissNotification(id);
      }, duration);
      
      // Store the timeout ID
      timeoutIds.current[id] = timeoutId;
    }
    
    return id;
  }, []);

  /**
   * Dismiss a notification by ID
   * @param {string} id - ID of the notification to dismiss
   */
  const dismissNotification = useCallback((id) => {
    // Remove the notification from state
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
    
    // Clear the timeout if it exists
    if (timeoutIds.current[id]) {
      clearTimeout(timeoutIds.current[id]);
      delete timeoutIds.current[id];
    }
  }, []);

  /**
   * Dismiss all notifications
   */
  const dismissAllNotifications = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutIds.current).forEach(id => clearTimeout(id));
    timeoutIds.current = {};
    
    // Remove all notifications
    setNotifications([]);
  }, []);

  /**
   * Convenience methods for different notification types
   */
  const success = useCallback((message, duration) => 
    showNotification(message, NOTIFICATION_TYPES.SUCCESS, duration), 
  [showNotification]);
  
  const error = useCallback((message, duration) => 
    showNotification(message, NOTIFICATION_TYPES.ERROR, duration), 
  [showNotification]);
  
  const info = useCallback((message, duration) => 
    showNotification(message, NOTIFICATION_TYPES.INFO, duration), 
  [showNotification]);
  
  const warning = useCallback((message, duration) => 
    showNotification(message, NOTIFICATION_TYPES.WARNING, duration), 
  [showNotification]);

  // Value to be provided by the context
  const contextValue = {
    notifications,
    showNotification,
    dismissNotification,
    dismissAllNotifications,
    success,
    error,
    info,
    warning
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use the notification context
 * @returns {object} - Notification context
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;