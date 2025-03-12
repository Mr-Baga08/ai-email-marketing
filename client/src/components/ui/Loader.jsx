import React from 'react';

/**
 * Loader component for displaying loading states
 * 
 * @param {Object} props - Component props
 * @param {string} [props.size='medium'] - Size of the loader
 * @param {string} [props.color='primary'] - Color theme of the loader
 * @param {string} [props.message] - Optional loading message
 * @param {boolean} [props.fullScreen] - Whether to display as a full-screen loader
 * @param {string} [props.className] - Additional CSS classes
 */
const Loader = ({ 
  size = 'medium', 
  color = 'primary', 
  message, 
  fullScreen = false,
  className = ''
}) => {
  // Determine loader size
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  // Determine color classes
  const colorClasses = {
    primary: 'border-blue-500 border-t-blue-600',
    secondary: 'border-gray-500 border-t-gray-600',
    success: 'border-green-500 border-t-green-600',
    danger: 'border-red-500 border-t-red-600'
  };

  // Base loader styles
  const loaderClasses = `
    ${sizeClasses[size] || sizeClasses.medium}
    ${colorClasses[color] || colorClasses.primary}
    border-4 
    border-solid 
    rounded-full 
    animate-spin
  `;

  // Full screen wrapper styles if needed
  const wrapperClasses = fullScreen 
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50' 
    : 'flex items-center justify-center';

  return (
    <div className={`${wrapperClasses} ${className}`}>
      <div className="flex flex-col items-center justify-center">
        <div className={loaderClasses} />
        {message && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;