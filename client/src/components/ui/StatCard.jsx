import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight 
} from 'lucide-react';

/**
 * StatCard component for displaying key metrics and statistics
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Title of the statistic
 * @param {string|number} props.value - Main statistical value
 * @param {string} [props.icon] - Icon component to display
 * @param {number} [props.percentage] - Percentage change
 * @param {string} [props.trend] - Trend direction ('up' or 'down')
 * @param {string} [props.description] - Additional description
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.action] - Optional action component
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  percentage,
  trend,
  description,
  className = '',
  action
}) => {
  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const iconProps = {
      className: `w-5 h-5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`,
      strokeWidth: 2
    };

    return trend === 'up' ? <TrendingUp {...iconProps} /> : <TrendingDown {...iconProps} />;
  };

  // Render percentage with trend
  const renderPercentage = () => {
    if (percentage === undefined) return null;
    
    return (
      <div className="flex items-center text-sm">
        {getTrendIcon()}
        <span className={`ml-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(percentage)}%
        </span>
      </div>
    );
  };

  return (
    <div className={`
      bg-white 
      dark:bg-gray-800 
      border 
      border-gray-200 
      dark:border-gray-700 
      rounded-lg 
      p-4 
      shadow-sm 
      hover:shadow-md 
      transition-shadow 
      duration-300 
      ${className}
    `}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          {Icon && <div className="mr-3 text-gray-500 dark:text-gray-400">{Icon}</div>}
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </h3>
        </div>
        {renderPercentage()}
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {action && (
          <div>
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;