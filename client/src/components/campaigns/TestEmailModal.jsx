import React, { useState } from 'react';
import { Mail, Send, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import  Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../contexts/ToastContext';

/**
 * TestEmailModal component for sending test emails before full campaign launch
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isOpen - Controls the visibility of the modal
 * @param {function} props.onClose - Callback to close the modal
 * @param {string} props.emailTemplate - The email template to be tested
 * @param {string} props.emailSubject - Subject of the email
 */
const TestEmailModal = ({ 
  isOpen, 
  onClose, 
  emailTemplate, 
  emailSubject 
}) => {
  const [testEmails, setTestEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  // Validate email addresses
  const validateEmails = (emails) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && emailRegex.test(email));
  };

  // Handle test email submission
  const handleTestEmail = async () => {
    // Validate emails
    const validEmails = validateEmails(testEmails);

    if (validEmails.length === 0) {
      addToast('Please enter valid email addresses', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate sending test emails
      await sendTestEmails(validEmails);
      
      addToast(`Test email sent to ${validEmails.join(', ')}`, 'success');
      onClose();
    } catch (error) {
      addToast('Failed to send test email', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulated email sending function (replace with actual API call)
  const sendTestEmails = async (emails) => {
    // Mock API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate potential failure
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Random test failure'));
        }
      }, 1500);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Test Email"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center text-gray-600 bg-blue-50 p-3 rounded-md">
          <Mail className="w-5 h-5 mr-3" />
          <p className="text-sm">
            You're about to send a test of your email campaign: {emailSubject}
          </p>
        </div>

        <div>
          <label 
            htmlFor="testEmails" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Test Email Addresses
          </label>
          <Input
            id="testEmails"
            placeholder="Enter email addresses (comma-separated)"
            value={testEmails}
            onChange={(e) => setTestEmails(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple emails with commas
          </p>
        </div>

        {testEmails && validateEmails(testEmails).length === 0 && (
          <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-5 h-5 mr-3" />
            <p className="text-sm">
              Please enter valid email addresses
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleTestEmail}
            disabled={
              isSubmitting || 
              validateEmails(testEmails).length === 0
            }
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Test Email'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TestEmailModal;