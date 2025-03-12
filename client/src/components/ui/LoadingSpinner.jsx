import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  text = '', 
  fullScreen = false,
  className = ''
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4'
  };
  
  // Color classes
  const colorClasses = {
    primary: 'border-indigo-600',
    secondary: 'border-gray-600',
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-500',
    purple: 'border-purple-600',
    white: 'border-white'
  };

  // Get the appropriate size and color classes based on props
  const spinnerSizeClass = sizeClasses[size] || sizeClasses.md;
  const spinnerColorClass = colorClasses[color] || colorClasses.primary;
  
  // Text size based on spinner size
  const textSizeClass = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }[size] || 'text-sm';

  // If fullScreen is true, render a full screen overlay with the spinner centered
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div 
            className={`${spinnerSizeClass} ${spinnerColorClass} border-t-transparent rounded-full animate-spin ${className}`}
          />
          {text && (
            <p className={`mt-4 text-white font-medium ${textSizeClass}`}>
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default inline spinner
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`${spinnerSizeClass} ${spinnerColorClass} border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className={`ml-3 font-medium ${textSizeClass}`}>
          {text}
        </p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['primary', 'secondary', 'blue', 'green', 'red', 'yellow', 'purple', 'white']),
  text: PropTypes.string,
  fullScreen: PropTypes.bool,
  className: PropTypes.string
};

export default LoadingSpinner;