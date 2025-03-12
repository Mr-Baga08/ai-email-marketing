import React, { useState, useEffect } from 'react';
import FeedbackForm from '../components/automation/FeedbackForm';
import { toast } from 'react-toastify';
import api from '../services/api';

const AutomationPage = () => {
  // State for email history
  const [emailHistory, setEmailHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for managing feedback modal
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  // Function to load email history
  const loadEmailHistory = async () => {
    try {
      setIsLoading(true);
      // Adjust the API call based on your actual API structure
      const response = await api.automation.getEmailHistory();
      
      // Assuming the API returns an array of email history items
      setEmailHistory(response.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching email history:', error);
      setError('Failed to load email history');
      toast.error('Unable to retrieve email history');
    } finally {
      setIsLoading(false);
    }
  };

  // Load email history when component mounts
  useEffect(() => {
    loadEmailHistory();
  }, []);

  // Function to handle feedback submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await api.feedback.submit(feedbackData);
      toast.success('Feedback submitted successfully!');
      setShowFeedback(false);
      loadEmailHistory(); // Refresh the email history
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Error submitting feedback. Please try again.');
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button 
          onClick={loadEmailHistory} 
          className="btn btn-primary ml-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="automation-page">
      <h1 className="text-2xl font-bold mb-4">Email Automation History</h1>

      {/* Email History List */}
      {emailHistory.length === 0 ? (
        <div className="alert alert-info">
          No email history found. Start an automation to see results.
        </div>
      ) : (
        <div className="space-y-4">
          {emailHistory.map((email) => (
            <div 
              key={email.id} 
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {email.subject || 'No Subject'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From: {email.from}
                  </p>
                  <p className="text-sm text-gray-600">
                    Received: {new Date(email.receivedDate).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <span 
                    className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${email.responseSent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    `}
                  >
                    {email.responseSent ? 'Responded' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Feedback Button */}
              <button
                onClick={() => {
                  setSelectedEmail(email);
                  setShowFeedback(true);
                }}
                className="btn btn-primary mt-4"
              >
                <i className="bi bi-star me-2"></i> Provide Feedback
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && selectedEmail && (
        <div className="modal fade show" style={{ display: 'block' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Provide Feedback</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFeedback(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h6 className="font-medium mb-2">Original Email:</h6>
                  <p className="text-sm text-gray-700">{selectedEmail.body}</p>
                </div>
                <div className="mb-4 p-4 bg-gray-50 rounded-md">
                  <h6 className="font-medium mb-2">AI Response:</h6>
                  <p className="text-sm text-gray-700">{selectedEmail.responseText}</p>
                </div>
                <FeedbackForm 
                  email={selectedEmail} 
                  onSubmit={handleFeedbackSubmit} 
                  onCancel={() => setShowFeedback(false)} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationPage;