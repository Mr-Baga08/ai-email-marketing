// /home/mrunal/Documents/AutoEmail/email-marketing-ai/client/src/components/ui/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  type = 'button', 
  className = '', 
  disabled = false, 
  loading = false, 
  onClick, 
  to,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props 
}) => {
  // Base classes for all button variants
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // Variant classes (colors)
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500',
    info: 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
    light: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 focus:ring-gray-500',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white focus:ring-gray-700',
    outline: 'bg-transparent hover:bg-gray-100 text-indigo-600 border border-indigo-600 focus:ring-indigo-500',
    link: 'bg-transparent hover:underline text-indigo-600 p-0 focus:ring-0'
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Create combined classes
  const classes = `
    ${baseClasses} 
    ${sizeClasses[size] || sizeClasses.md} 
    ${variantClasses[variant] || variantClasses.primary}
    ${disabled || loading ? disabledClasses : ''}
    ${widthClass}
    ${className}
  `;
  
  // Loading spinner component
  const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
  
  // Icon element
  const IconElement = icon ? (
    <span className={`${iconPosition === 'left' ? 'mr-2' : 'ml-2'}`}>
      {icon}
    </span>
  ) : null;
  
  // If it's a link
  if (to) {
    return (
      <Link 
        to={to} 
        className={classes} 
        {...props}
      >
        {loading && <Spinner />}
        {icon && iconPosition === 'left' && IconElement}
        {children}
        {icon && iconPosition === 'right' && IconElement}
      </Link>
    );
  }
  
  // Regular button
  return (
    <button 
      type={type} 
      className={classes} 
      disabled={disabled || loading} 
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner />}
      {icon && iconPosition === 'left' && IconElement}
      {children}
      {icon && iconPosition === 'right' && IconElement}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger', 
    'warning', 'info', 'light', 'dark', 'outline', 'link'
  ]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  to: PropTypes.string,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool
};

export default Button;