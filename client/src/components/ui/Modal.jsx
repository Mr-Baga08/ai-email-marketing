import React, { useEffect } from 'react';
import { X } from 'lucide-react';


/**
 * Modal component for displaying content in an overlay
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls the visibility of the modal
 * @param {function} props.onClose - Callback function to close the modal
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.title] - Optional modal title
 * @param {string} [props.size] - Modal size ('sm', 'md', 'lg', 'xl')
 * @param {string} [props.className] - Additional CSS classes for the modal
 * @param {boolean} [props.closeOnOverlay] - Close modal when clicking outside
 * @param {React.ReactNode} [props.footer] - Optional footer content
 * 
 */
const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  className = '',
  closeOnOverlay = true,
  footer
}) => {
  // Size configurations
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // If modal is not open, return null
  if (!isOpen) return null;

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div 
        className={`
          bg-white 
          dark:bg-gray-800 
          rounded-lg 
          shadow-xl 
          relative 
          w-full 
          ${sizeClasses[size]} 
          mx-4 
          transform 
          transition-all 
          duration-300 
          scale-100 
          opacity-100
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        // Stop propagation to prevent closing when clicking inside modal
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {title && (
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="
                text-gray-500 
                hover:text-gray-700 
                dark:text-gray-400 
                dark:hover:text-gray-200 
                transition-colors
              "
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className={`p-4 ${title ? '' : 'pt-6'}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;