import React, { useState } from 'react';
import { Copy, Info } from 'lucide-react';

// Predefined personalization tags with descriptions
const DEFAULT_TAGS = [
  {
    category: 'Contact Information',
    tags: [
      { 
        tag: '{First Name}', 
        description: 'Recipient\'s first name' 
      },
      { 
        tag: '{Last Name}', 
        description: 'Recipient\'s last name' 
      },
      { 
        tag: '{Email}', 
        description: 'Recipient\'s email address' 
      },
    ]
  },
  {
    category: 'Company Details',
    tags: [
      { 
        tag: '{Company}', 
        description: 'Recipient\'s company name' 
      },
      { 
        tag: '{Company Size}', 
        description: 'Number of employees in the company' 
      },
      { 
        tag: '{Industry}', 
        description: 'Recipient\'s industry' 
      },
    ]
  },
  {
    category: 'Custom Fields',
    tags: [
      { 
        tag: '{Job Title}', 
        description: 'Recipient\'s job title' 
      },
      { 
        tag: '{Phone}', 
        description: 'Recipient\'s phone number' 
      },
      { 
        tag: '{Location}', 
        description: 'Recipient\'s city or region' 
      },
    ]
  }
];

/**
 * PersonalizationTags component for displaying and copying email template tags
 * 
 * @param {Object} props - Component properties
 * @param {function} [props.onTagSelect] - Callback when a tag is selected
 * @param {string} [props.className] - Additional CSS classes
 */
const PersonalizationTags = ({ 
  onTagSelect, 
  className = '' 
}) => {
  const [copiedTag, setCopiedTag] = useState(null);

  // Copy tag to clipboard
  const handleCopyTag = async (tag) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedTag(null), 2000);
    } catch (err) {
      console.error('Failed to copy tag', err);
    }
  };

  // Handle tag selection (if callback provided)
  const handleTagSelect = (tag) => {
    if (onTagSelect) {
      onTagSelect(tag);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-500" />
          Personalization Tags
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Click to copy or insert tags into your email template
        </p>
      </div>

      <div className="p-4">
        {DEFAULT_TAGS.map((category) => (
          <div key={category.category} className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {category.category}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {category.tags.map((tagItem) => (
                <div 
                  key={tagItem.tag}
                  className="
                    flex 
                    items-center 
                    justify-between 
                    bg-gray-100 
                    dark:bg-gray-700 
                    rounded 
                    p-2 
                    hover:bg-gray-200 
                    dark:hover:bg-gray-600 
                    transition-colors 
                    cursor-pointer
                    group
                  "
                >
                  <div 
                    className="flex-1"
                    onClick={() => handleTagSelect(tagItem.tag)}
                  >
                    <span className="text-sm font-mono text-blue-600 dark:text-blue-400">
                      {tagItem.tag}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tagItem.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyTag(tagItem.tag)}
                    className="
                      ml-2 
                      text-gray-500 
                      hover:text-blue-500 
                      dark:hover:text-blue-400 
                      transition-colors
                    "
                    aria-label={`Copy ${tagItem.tag}`}
                  >
                    {copiedTag === tagItem.tag ? (
                      <span className="text-xs text-green-500">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: You can use these tags to dynamically personalize your email content. 
          The system will automatically replace them with the recipient's specific information.
        </p>
      </div>
    </div>
  );
};

export default PersonalizationTags;