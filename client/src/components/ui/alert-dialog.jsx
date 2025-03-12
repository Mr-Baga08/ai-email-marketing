import React from 'react';
import { X } from 'lucide-react';

/**
 * AlertDialog component for displaying confirmation or important messages
 */
const AlertDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children 
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog Content */}
      <div className="
        relative 
        bg-white 
        dark:bg-gray-800 
        rounded-lg 
        shadow-xl 
        max-w-md 
        w-full 
        mx-4 
        z-50
      ">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

// Sub-components to match the expected structure
const AlertDialogTrigger = ({ children, onClick }) => (
  <div onClick={onClick}>{children}</div>
);

const AlertDialogContent = ({ children }) => children;

const AlertDialogHeader = ({ children }) => (
  <div className="mb-4">{children}</div>
);

const AlertDialogTitle = ({ children }) => (
  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
    {children}
  </h2>
);

const AlertDialogDescription = ({ children }) => (
  <p className="text-sm text-gray-600 dark:text-gray-300">
    {children}
  </p>
);

const AlertDialogFooter = ({ children }) => (
  <div className="flex justify-end space-x-2 mt-4">
    {children}
  </div>
);

const AlertDialogCancel = ({ children, onClick }) => (
  <button 
    onClick={onClick}
    className="
      px-4 
      py-2 
      bg-gray-200 
      text-gray-700 
      rounded 
      hover:bg-gray-300 
      transition-colors
    "
  >
    {children || 'Cancel'}
  </button>
);

const AlertDialogAction = ({ children, onClick }) => (
  <button 
    onClick={onClick}
    className="
      px-4 
      py-2 
      bg-blue-500 
      text-white 
      rounded 
      hover:bg-blue-600 
      transition-colors
    "
  >
    {children || 'Confirm'}
  </button>
);

// Attach sub-components to the main component
AlertDialog.Trigger = AlertDialogTrigger;
AlertDialog.Content = AlertDialogContent;
AlertDialog.Header = AlertDialogHeader;
AlertDialogTrigger.Title = AlertDialogTitle;
AlertDialogTrigger.Description = AlertDialogDescription;
AlertDialog.Footer = AlertDialogFooter;
AlertDialog.Cancel = AlertDialogCancel;
AlertDialog.Action = AlertDialogAction;

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
};