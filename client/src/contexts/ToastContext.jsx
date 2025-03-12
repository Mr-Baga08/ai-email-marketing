import React, { createContext, useState, useContext, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

// Toast type definitions
const TOAST_TYPES = {
  success: {
    icon: CheckCircle2,
    baseClass: 'bg-green-500 text-white',
    borderClass: 'border-green-600'
  },
  error: {
    icon: AlertCircle,
    baseClass: 'bg-red-500 text-white',
    borderClass: 'border-red-600'
  },
  warning: {
    icon: AlertTriangle,
    baseClass: 'bg-yellow-500 text-white',
    borderClass: 'border-yellow-600'
  },
  info: {
    icon: Info,
    baseClass: 'bg-blue-500 text-white',
    borderClass: 'border-blue-600'
  }
};

// Create the context
const ToastContext = createContext({
  addToast: () => {},
  removeToast: () => {}
});

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Generate unique ID for each toast
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Add a new toast
  const addToast = useCallback((
    message, 
    type = 'info', 
    duration = 5000
  ) => {
    const id = generateId();
    const newToast = { id, message, type };

    setToasts(currentToasts => [...currentToasts, newToast]);

    // Automatically remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  // Remove a specific toast
  const removeToast = useCallback((id) => {
    setToasts(currentToasts => 
      currentToasts.filter(toast => toast.id !== id)
    );
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => {
          const ToastIcon = TOAST_TYPES[toast.type].icon;
          return (
            <div 
              key={toast.id}
              className={`
                flex items-center 
                p-4 
                rounded-lg 
                shadow-lg 
                border-l-4 
                transform 
                transition-all 
                duration-300 
                ${TOAST_TYPES[toast.type].baseClass}
                ${TOAST_TYPES[toast.type].borderClass}
                animate-slide-in-right
              `}
            >
              <div className="flex items-center mr-4">
                <ToastIcon className="w-6 h-6 mr-2" />
                <span className="font-medium">{toast.message}</span>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="ml-auto hover:opacity-75 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};