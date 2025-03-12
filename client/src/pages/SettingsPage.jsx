import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaKey, 
  FaCreditCard, 
  FaBell, 
  FaRobot,
  FaCheck,
  FaExclamationTriangle,
  FaTimes,
  FaSave
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FaInfo, FaFileInvoice } from 'react-icons/fa';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Form data states
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    company: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [aiSettings, setAiSettings] = useState({
    temperature: 0.7,
    model: 'gemini-pro',
    autoRespond: true,
    reviewThreshold: 0.7
  });
  
  const [emailIntegration, setEmailIntegration] = useState({
    provider: '',
    email: '',
    verified: false
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignReports: true,
    automationAlerts: true,
    marketingUpdates: false
  });
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Fetch user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        company: user.company || ''
      });
      
      if (user.emailIntegration) {
        setEmailIntegration({
          provider: user.emailIntegration.provider || '',
          email: user.emailIntegration.credentials?.email || '',
          verified: user.emailIntegration.verified || false
        });
      }
      
      if (user.settings?.aiSettings) {
        setAiSettings({
          temperature: user.settings.aiSettings.temperature || 0.7,
          model: user.settings.aiSettings.model || 'gemini-pro',
          autoRespond: user.settings.aiSettings.autoRespond !== false,
          reviewThreshold: user.settings.aiSettings.reviewThreshold || 0.7
        });
      }
      
      // Fetch notification settings
      // This would be a real API call in a production app
      // For now we'll use default values
    }
  }, [user]);
  
  // Handle profile form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      const response = await api.auth.updateProfile(profileData);
      
      // Update user context
      updateUser(response);
      
      setSuccessMessage('Profile updated successfully');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      await api.auth.changePassword(passwordData);
      
      setSuccessMessage('Password changed successfully');
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle AI settings change
  const handleAISettingsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Update settings
      const response = await api.auth.updateProfile({
        settings: {
          ...user.settings,
          aiSettings
        }
      });
      
      // Update user context
      updateUser(response);
      
      setSuccessMessage('AI settings updated successfully');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update AI settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle email integration reconnect
  const handleReconnectEmail = () => {
    navigate('/setup-email');
  };
  
  // Handle email disconnection
  const handleDisconnectEmail = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      await api.integrations.disconnectEmailIntegration();
      
      // Update user context
      updateUser({
        emailIntegration: {
          provider: 'none',
          verified: false
        }
      });
      
      setSuccessMessage('Email integration disconnected successfully');
      setEmailIntegration({
        provider: 'none',
        email: '',
        verified: false
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to disconnect email integration');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle notification settings
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // Make actual API call
      const response = await api.auth.updateProfile({
        settings: {
          ...user.settings,
          notifications: notificationSettings
        }
      });
      
      // Update user context
      updateUser(response);
      
      setSuccessMessage('Notification settings updated successfully');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle subscription plan change
  const handleChangePlan = () => {
    navigate('/select-plan');
  };
  
  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="grid grid-cols-12">
          {/* Settings Navigation */}
          <div className="col-span-12 md:col-span-3 border-r border-gray-200">
            <nav className="p-4">
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'profile' 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <FaUser className="mr-3" /> Profile
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'email' 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <FaEnvelope className="mr-3" /> Email Integration
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'password' 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <FaKey className="mr-3" /> Password
                  </button>
                </li>
                {user?.subscription?.aiEmailAutomation && (
                  <li>
                    <button
                      onClick={() => setActiveTab('ai')}
                      className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                        activeTab === 'ai' 
                          ? 'bg-indigo-50 text-indigo-700 font-medium' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <FaRobot className="mr-3" /> AI Settings
                    </button>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => setActiveTab('subscription')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'subscription' 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <FaCreditCard className="mr-3" /> Subscription
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full text-left px-4 py-2 rounded-md flex items-center ${
                      activeTab === 'notifications' 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <FaBell className="mr-3" /> Notifications
                  </button>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Settings Content */}
          <div className="col-span-12 md:col-span-9 p-6">
            {/* Success and Error Messages */}
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 flex items-start"
              >
                <FaCheck className="text-green-500 mt-1 mr-3" />
                <p className="text-green-700">{successMessage}</p>
              </motion.div>
            )}
            
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start"
              >
                <FaExclamationTriangle className="text-red-500 mt-1 mr-3" />
                <p className="text-red-700">{errorMessage}</p>
              </motion.div>
            )}
            
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={profileData.company}
                        onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
            
            {/* Email Integration Settings */}
            {activeTab === 'email' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Email Integration</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{emailIntegration.provider === 'none' ? 'No Email Provider' : emailIntegration.provider}</h3>
                      <p className="text-gray-500">{emailIntegration.email}</p>
                    </div>
                    <div>
                      {emailIntegration.verified ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <FaCheck className="mr-1" /> Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <FaTimes className="mr-1" /> Not Connected
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {emailIntegration.verified ? (
                      <button
                        onClick={handleDisconnectEmail}
                        disabled={isLoading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Disconnecting...' : 'Disconnect'}
                      </button>
                    ) : (
                      <button
                        onClick={handleReconnectEmail}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Connect Email Provider
                      </button>
                    )}
                    
                    {emailIntegration.verified && (
                      <button
                        onClick={handleReconnectEmail}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Change Provider
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 flex items-start max-w-lg">
                  <FaInfo className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Why connect an email provider?</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Connecting an email provider allows you to send campaigns from your own email address and enables the AI Email Automation features.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Password Settings */}
            {activeTab === 'password' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Change Password</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </>
                        ) : 'Change Password'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
            
            {/* AI Settings */}
            {activeTab === 'ai' && user?.subscription?.aiEmailAutomation && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">AI Settings</h2>
                <form onSubmit={handleAISettingsSubmit}>
                  <div className="space-y-6 max-w-lg">
                    <div>
                      <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                        AI Model
                      </label>
                      <select
                        id="model"
                        name="model"
                        value={aiSettings.model}
                        onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="gemini-pro">Gemini Pro (Recommended)</option>
                        <option value="llama2">Llama 2</option>
                        <option value="phi-2">Phi-2 (Fastest)</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Select the AI model to use for generating email responses.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                        Creativity (Temperature): {aiSettings.temperature}
                      </label>
                      <input
                        type="range"
                        id="temperature"
                        name="temperature"
                        min="0"
                        max="1"
                        step="0.1"
                        value={aiSettings.temperature}
                        onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>More predictable</span>
                        <span>More creative</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="autoRespond"
                          name="autoRespond"
                          checked={aiSettings.autoRespond}
                          onChange={(e) => setAiSettings({...aiSettings, autoRespond: e.target.checked})}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="autoRespond" className="ml-2 block text-sm text-gray-700">
                          Automatically send AI responses
                        </label>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 ml-6">
                        When enabled, the AI will automatically send responses without human review.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="reviewThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                        Human Review Threshold: {aiSettings.reviewThreshold}
                      </label>
                      <input
                        type="range"
                        id="reviewThreshold"
                        name="reviewThreshold"
                        min="0"
                        max="1"
                        step="0.1"
                        value={aiSettings.reviewThreshold}
                        onChange={(e) => setAiSettings({...aiSettings, reviewThreshold: parseFloat(e.target.value)})}
                        className="w-full"
                        disabled={!aiSettings.autoRespond}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>More automated</span>
                        <span>More human reviews</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Higher values will flag more emails for human review.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" /> Save Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
            
            {/* Subscription Settings */}
            {activeTab === 'subscription' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Subscription</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-lg">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">Current Plan:</h3>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        {user?.subscription?.plan?.charAt(0).toUpperCase() + user?.subscription?.plan?.slice(1) || 'Free'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Status:</span>
                      <span className={`font-medium ${user?.subscription?.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {user?.subscription?.status?.charAt(0).toUpperCase() + user?.subscription?.status?.slice(1) || 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Start Date:</span>
                      <span>{user?.subscription?.startDate ? new Date(user.subscription.startDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>AI Email Automation:</span>
                      <span className={user?.subscription?.aiEmailAutomation ? 'text-green-600' : 'text-gray-600'}>
                        {user?.subscription?.aiEmailAutomation ? 'Enabled' : 'Not Enabled'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleChangePlan}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Change Plan
                    </button>
                    
                    {!user?.subscription?.aiEmailAutomation && (
                      <button
                        onClick={() => navigate('/select-plan?addon=ai')}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaRobot className="mr-2" /> Add AI Email Automation
                      </button>
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold mb-3">Billing Information</h3>
                <p className="text-gray-600 mb-3">
                  View and update your billing information or download past invoices.
                </p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => navigate('/billing')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaCreditCard className="mr-2" /> Manage Billing
                  </button>
                  
                  <button
                    onClick={() => navigate('/invoices')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <FaFileInvoice className="mr-2" /> View Invoices
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>
                <form onSubmit={handleNotificationSubmit}>
                  <div className="space-y-4 max-w-lg">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="emailNotifications"
                          name="emailNotifications"
                          type="checkbox"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: e.target.checked
                          })}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                          Email Notifications
                        </label>
                        <p className="text-gray-500">Receive general notifications via email.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="campaignReports"
                          name="campaignReports"
                          type="checkbox"
                          checked={notificationSettings.campaignReports}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            campaignReports: e.target.checked
                          })}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="campaignReports" className="font-medium text-gray-700">
                          Campaign Reports
                        </label>
                        <p className="text-gray-500">Receive reports after campaign completion.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="automationAlerts"
                          name="automationAlerts"
                          type="checkbox"
                          checked={notificationSettings.automationAlerts}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            automationAlerts: e.target.checked
                          })}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="automationAlerts" className="font-medium text-gray-700">
                          Automation Alerts
                        </label>
                        <p className="text-gray-500">Get notifications about AI automation issues or when human review is needed.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="marketingUpdates"
                          name="marketingUpdates"
                          type="checkbox"
                          checked={notificationSettings.marketingUpdates}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            marketingUpdates: e.target.checked
                          })}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="marketingUpdates" className="font-medium text-gray-700">
                          Marketing Updates
                        </label>
                        <p className="text-gray-500">Receive updates about new features and promotions.</p>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" /> Save Preferences
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;