import React, { forwardRef } from 'react';
import { Search, X, Eye, EyeOff } from 'lucide-react';

/**
 * Input component with multiple variants and states
 * 
 * @param {Object} props - Component properties
 * @param {string} [props.variant] - Input variant ('default', 'search', 'password')
 * @param {string} [props.size] - Input size ('sm', 'md', 'lg')
 * @param {boolean} [props.disabled] - Disable the input
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.leftIcon] - Icon to display on the left side
 * @param {React.ReactNode} [props.rightIcon] - Icon to display on the right side
 * @param {boolean} [props.error] - Error state for the input
 * @param {string} [props.errorMessage] - Error message to display
 */
const Input = forwardRef(({
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  error = false,
  errorMessage,
  type = 'text',
  ...props
}, ref) => {
  // Size configurations
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg'
  };

  // State and variant classes
  const stateClasses = {
    default: `
      border 
      ${error 
        ? 'border-red-500 focus:ring-red-200' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
      }
      focus:outline-none 
      focus:ring-2 
      focus:ring-opacity-50
    `,
    search: `
      pl-10 
      ${error 
        ? 'border-red-500 focus:ring-red-200' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
      }
      focus:outline-none 
      focus:ring-2 
      focus:ring-opacity-50
    `
  };

  // Render additional icons or password toggle
  const renderRightIcon = () => {
    if (variant === 'password') {
      return (
        <button 
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={props.onTogglePasswordVisibility}
        >
          {type === 'password' ? <Eye /> : <EyeOff />}
        </button>
      );
    }
    
    return RightIcon && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
        {RightIcon}
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {/* Left Icon */}
      {LeftIcon && variant === 'search' && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          <Search className="w-5 h-5" />
        </div>
      )}

      {/* Input Field */}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={`
          w-full 
          rounded-md 
          ${sizeClasses[size]}
          ${stateClasses[variant]}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${LeftIcon && variant === 'search' ? 'pl-10' : ''}
          ${className}
        `}
        {...props}
      />

      {/* Right Icon or Password Toggle */}
      {renderRightIcon()}

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;