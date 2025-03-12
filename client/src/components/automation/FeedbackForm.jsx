// client/src/components/automation/FeedbackForm.jsx
import React, { useState } from 'react';
import { FaStar, FaThumbsUp, FaThumbsDown, FaPen } from 'react-icons/fa';

const FeedbackForm = ({ email, onSubmit, onCancel }) => {
  const [feedbackType, setFeedbackType] = useState('');
  const [rating, setRating] = useState(0);
  const [improvedResponse, setImprovedResponse] = useState(email.responseText || '');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const improvementOptions = [
    { id: 'factual_accuracy', label: 'Factual Accuracy' },
    { id: 'relevance', label: 'Relevance to Query' },
    { id: 'tone', label: 'Tone & Professionalism' },
    { id: 'grammar', label: 'Grammar & Spelling' },
    { id: 'clarity', label: 'Clarity & Structure' },
    { id: 'completeness', label: 'Completeness' },
    { id: 'personalization', label: 'Personalization' }
  ];

  const handleImprovementToggle = (id) => {
    if (improvements.includes(id)) {
      setImprovements(improvements.filter(item => item !== id));
    } else {
      setImprovements([...improvements, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackType) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        automatedEmailId: email._id,
        feedbackType,
        rating: feedbackType !== 'edit' ? rating : undefined,
        improvedResponse: feedbackType === 'edit' ? improvedResponse : undefined,
        feedbackNotes,
        improvements: feedbackType !== 'approve' ? improvements : []
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">How would you rate this response?</h3>
        <div className="flex space-x-4">
          <button
            type="button"
            className={`flex items-center px-4 py-2 rounded-md ${
              feedbackType === 'approve' ? 'bg-green-100 border-green-500 border-2' : 'bg-gray-100'
            }`}
            onClick={() => setFeedbackType('approve')}
          >
            <FaThumbsUp className="mr-2 text-green-600" /> Approve
          </button>
          <button
            type="button"
            className={`flex items-center px-4 py-2 rounded-md ${
              feedbackType === 'reject' ? 'bg-red-100 border-red-500 border-2' : 'bg-gray-100'
            }`}
            onClick={() => setFeedbackType('reject')}
          >
            <FaThumbsDown className="mr-2 text-red-600" /> Needs Improvement
          </button>
          <button
            type="button"
            className={`flex items-center px-4 py-2 rounded-md ${
              feedbackType === 'edit' ? 'bg-blue-100 border-blue-500 border-2' : 'bg-gray-100'
            }`}
            onClick={() => setFeedbackType('edit')}
          >
            <FaPen className="mr-2 text-blue-600" /> Edit & Use
          </button>
        </div>
      </div>

      {(feedbackType === 'approve' || feedbackType === 'reject') && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Rating:</h3>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
              >
                <FaStar 
                  className={`h-8 w-8 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {feedbackType === 'edit' && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Edit Response:</h3>
          <textarea
            value={improvedResponse}
            onChange={(e) => setImprovedResponse(e.target.value)}
            className="w-full h-64 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            required={feedbackType === 'edit'}
          />
        </div>
      )}

      {feedbackType !== 'approve' && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Areas for Improvement:</h3>
          <div className="grid grid-cols-2 gap-2">
            {improvementOptions.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={option.id}
                  checked={improvements.includes(option.id)}
                  onChange={() => handleImprovementToggle(option.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor={option.id} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Additional Notes (Optional):</h3>
        <textarea
          value={feedbackNotes}
          onChange={(e) => setFeedbackNotes(e.target.value)}
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Any specific comments about this response..."
        />
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!feedbackType || isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
};

export default FeedbackForm;