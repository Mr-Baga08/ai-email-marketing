import React from 'react';
import { 
  MailOpen, 
  Send, 
  Users, 
  Activity, 
  AlertCircle 
} from 'lucide-react';

// Mapping of activity types to icons and styles
const ACTIVITY_ICONS = {
  email_sent: Send,
  email_opened: MailOpen,
  contact_added: Users,
  campaign_created: Activity,
  error: AlertCircle
};

const ACTIVITY_COLORS = {
  email_sent: 'text-blue-500',
  email_opened: 'text-green-500',
  contact_added: 'text-purple-500',
  campaign_created: 'text-orange-500',
  error: 'text-red-500'
};

/**
 * ActivityFeed component for displaying recent system activities
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.activities - List of activities to display
 * @param {number} [props.limit] - Maximum number of activities to show
 * @param {string} [props.className] - Additional CSS classes
 */
const ActivityFeed = ({ 
  activities = [], 
  limit = 5,
  className = '' 
}) => {
  // Format timestamp to human-readable relative time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const mins = Math.floor(diffInSeconds / 60);
      return `${mins} min${mins > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString();
  };

  // Truncate activities to specified limit
  const displayActivities = activities.slice(0, limit);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Recent Activity
        </h3>
      </div>
      
      {displayActivities.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          No recent activities
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {displayActivities.map((activity, index) => {
            const Icon = ACTIVITY_ICONS[activity.type] || Activity;
            const iconColor = ACTIVITY_COLORS[activity.type] || 'text-gray-500';

            return (
              <li 
                key={activity.id || index} 
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                  {activity.details && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.details}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;