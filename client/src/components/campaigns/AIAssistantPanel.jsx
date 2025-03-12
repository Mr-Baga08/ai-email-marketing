import React, { useState } from 'react';
import { 
  Wand2, 
  RefreshCw, 
  Copy, 
  Check, 
  Sparkles, 
  Lightbulb 
} from 'lucide-react';

// Simulated AI service (would be replaced with actual API calls)
const AIService = {
  generateEmailTemplate: async (options) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    return `Dear ${options.recipientName || 'Valued Customer'},

We're excited to share an exclusive offer tailored just for you. 

At Astraeus Next Gen, we understand the challenges businesses face in maintaining robust cybersecurity. Our latest penetration testing services are designed to uncover vulnerabilities before they become critical threats.

🔒 Why Choose Our Services?
- Comprehensive vulnerability scanning
- Discreet, confidential reporting
- Certified cybersecurity experts
- Risk-based prioritization

Would you like to schedule a free consultation to strengthen your digital defenses?

Best regards,
Shreejit Sen
CEO, Astraeus Next Gen`;
  },

  suggestImprovements: async (currentTemplate) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      "Add a more personalized opening",
      "Include a specific call-to-action",
      "Highlight unique value proposition"
    ];
  }
};

const AIAssistantPanel = ({ onTemplateGenerate }) => {
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [copied, setCopied] = useState(false);

  // Form state
  const [options, setOptions] = useState({
    recipientName: '',
    industry: '',
    campaignGoal: ''
  });

  // Generate email template
  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    setImprovements([]);

    try {
      const template = await AIService.generateEmailTemplate(options);
      setGeneratedTemplate(template);
      
      // Suggest improvements
      const suggestionList = await AIService.suggestImprovements(template);
      setImprovements(suggestionList);

      // Callback to parent component
      if (onTemplateGenerate) {
        onTemplateGenerate(template);
      }
    } catch (error) {
      console.error('Error generating template:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy template to clipboard
  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(generatedTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          AI Email Template Assistant
        </h2>
      </div>

      {/* Generation Options */}
      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipient Details
          </label>
          <input 
            type="text" 
            placeholder="Recipient Name (Optional)"
            value={options.recipientName}
            onChange={(e) => setOptions({...options, recipientName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Industry
          </label>
          <select
            value={options.industry}
            onChange={(e) => setOptions({...options, industry: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select Industry</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Campaign Goal
          </label>
          <textarea
            placeholder="Describe the purpose of your email campaign"
            value={options.campaignGoal}
            onChange={(e) => setOptions({...options, campaignGoal: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateTemplate}
        disabled={isGenerating}
        className={`
          w-full 
          flex 
          items-center 
          justify-center 
          py-2 
          px-4 
          rounded-md 
          text-white 
          transition-colors 
          ${isGenerating 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-purple-600 hover:bg-purple-700'
          }
        `}
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Generate AI Template
          </>
        )}
      </button>

      {/* Generated Template */}
      {generatedTemplate && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
              Generated Template
            </h3>
            <button 
              onClick={handleCopyTemplate}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre 
            className="
              bg-gray-50 
              dark:bg-gray-700 
              p-4 
              rounded-md 
              overflow-x-auto 
              whitespace-pre-wrap 
              text-sm 
              text-gray-700 
              dark:text-gray-300
              border 
              border-gray-200 
              dark:border-gray-600
            "
          >
            {generatedTemplate}
          </pre>
        </div>
      )}

      {/* Improvement Suggestions */}
      {improvements.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
            AI Improvement Suggestions
          </h3>
          <ul className="space-y-2">
            {improvements.map((suggestion, index) => (
              <li 
                key={index} 
                className="
                  flex 
                  items-center 
                  bg-blue-50 
                  dark:bg-blue-900 
                  dark:bg-opacity-30 
                  p-2 
                  rounded-md 
                  text-sm 
                  text-blue-800 
                  dark:text-blue-200
                "
              >
                <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;