import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * EmptyState component to display when no data is available
 * 
 * @param {Object} props - Component props
 * @param {string} [props.title] - Main title for the empty state
 * @param {string} [props.description] - Descriptive text explaining the empty state
 * @param {React.ReactNode} [props.icon] - Custom icon component (defaults to Inbox icon)
 * @param {React.ReactNode} [props.action] - Optional action button or component
 * @param {string} [props.className] - Additional CSS classes
 */
const EmptyState = ({
  title = 'No data available',
  description = 'There is currently no information to display.',
  icon,
  action,
  className = ''
}) => {
  // Default icon if not provided
  const Icon = icon || <Inbox className="w-16 h-16 text-gray-400" />;

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="max-w-md">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          {Icon}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
          {title}
        </h2>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>

        {/* Action */}
        {action && (
          <div className="flex justify-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;