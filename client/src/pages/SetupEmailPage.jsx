import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaGoogle, FaMicrosoft, FaEnvelope, FaPlus, FaCheck } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SetupEmailPage = () => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    server: '',
    port: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, loading, success, error
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Email providers
  const providers = [
    {
      id: 'titan',
      name: 'Titan Email',
      icon: <FaEnvelope className="h-6 w-6" />,
      description: 'Professional email built for businesses'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: <FaGoogle className="h-6 w-6" />,
      description: 'Connect your Google Workspace or Gmail account'
    },
    {
      id: 'outlook',
      name: 'Outlook',
      icon: <FaMicrosoft className="h-6 w-6" />,
      description: 'Microsoft Outlook or Office 365'
    },
    {
      id: 'other',
      name: 'Other Provider',
      icon: <FaPlus className="h-6 w-6" />,
      description: 'Custom SMTP/IMAP configuration'
    }
  ];

  const handleProviderSelect = (providerId) => {
    setSelectedProvider(providerId);
    setVerificationStatus('idle');
    setError('');
    
    // Reset form when changing providers
    if (providerId === 'gmail' || providerId === 'outlook') {
      // For OAuth providers, reset form
      setCredentials({
        email: '',
        password: '',
        server: '',
        port: ''
      });
    } else if (providerId === 'titan') {
      // For Titan, set default server and port
      setCredentials({
        ...credentials,
        server: 'smtp.titan.email',
        port: '587'
      });
    } else {
      // For other, keep email but reset other fields
      setCredentials({
        ...credentials,
        password: '',
        server: '',
        port: ''
      });
    }
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleOAuthConnect = async (provider) => {
    try {
      setVerificationStatus('loading');
      setError('');
      
      // Initiate OAuth flow with backend
      const response = await api.integrations.initiateOAuth(provider);
      
      // Open OAuth window
      window.location.href = response.authUrl;
    } catch (error) {
      setVerificationStatus('error');
      setError(error.response?.data?.message || `Failed to connect to ${provider}. Please try again.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProvider) {
      setError('Please select an email provider');
      return;
    }
    
    // Validate form
    if (selectedProvider !== 'gmail' && selectedProvider !== 'outlook') {
      if (!credentials.email) {
        setError('Email is required');
        return;
      }
      
      if (!credentials.password) {
        setError('Password is required');
        return;
      }
      
      if (selectedProvider === 'other' && (!credentials.server || !credentials.port)) {
        setError('Server and port are required for custom email providers');
        return;
      }
    }
    
    setIsLoading(true);
    setVerificationStatus('loading');
    setError('');
    
    try {
      // Verify credentials
      const response = await api.integrations.verifyEmailCredentials({
        provider: selectedProvider,
        credentials
      });
      
      // Update user with email integration info
      if (response.success) {
        setVerificationStatus('success');
        
        // Update user context
        updateUser({
          emailIntegration: {
            provider: selectedProvider,
            verified: true
          }
        });
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setVerificationStatus('error');
        setError(response.message || 'Verification failed. Please check your credentials.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setError(error.response?.data?.message || 'Failed to verify email credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderForm = () => {
    if (!selectedProvider) {
      return null;
    }
    
    if (selectedProvider === 'gmail') {
      return (
        <div className="text-center px-8 py-6">
          <p className="mb-6 text-gray-600">Connect your Gmail account to enable email campaigns and automation.</p>
          <button
            type="button"
            onClick={() => handleOAuthConnect('gmail')}
            disabled={verificationStatus === 'loading'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <FaGoogle className="mr-2" /> Connect with Google
          </button>
        </div>
      );
    }
    
    if (selectedProvider === 'outlook') {
      return (
        <div className="text-center px-8 py-6">
          <p className="mb-6 text-gray-600">Connect your Microsoft account to enable email campaigns and automation.</p>
          <button
            type="button"
            onClick={() => handleOAuthConnect('outlook')}
            disabled={verificationStatus === 'loading'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaMicrosoft className="mr-2" /> Connect with Microsoft
          </button>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleInputChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        
        {selectedProvider === 'other' && (
          <>
            <div>
              <label htmlFor="server" className="block text-sm font-medium text-gray-700">SMTP Server</label>
              <input
                type="text"
                id="server"
                name="server"
                value={credentials.server}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="smtp.example.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="port" className="block text-sm font-medium text-gray-700">Port</label>
              <input
                type="text"
                id="port"
                name="port"
                value={credentials.port}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="587"
                required
              />
            </div>
          </>
        )}
        
        <div className="mt-6">
          <button
            type="submit"
            disabled={isLoading || verificationStatus === 'loading'}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {verificationStatus === 'loading' ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </>
            ) : 'Verify and Connect'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Set Up Your Email Provider</h1>
              <p className="text-lg text-gray-600">
                Connect your email account to enable email campaigns and automation.
              </p>
            </div>
            
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {verificationStatus === 'success' && (
              <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaCheck className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      Email connection successful! Redirecting to your dashboard...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 p-1">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedProvider === provider.id
                        ? 'bg-indigo-50 border-2 border-indigo-500 rounded-md'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <div className="flex flex-col items-center text-center p-4">
                      <div className={`p-3 rounded-full mb-4 ${
                        selectedProvider === provider.id ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        {provider.icon}
                      </div>
                      <h3 className="text-lg font-medium">{provider.name}</h3>
                      <p className="mt-2 text-sm text-gray-500">{provider.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedProvider && renderProviderForm()}
            </div>
            
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-indigo-600 hover:text-indigo-500"
              >
                Skip for now (limited functionality)
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default SetupEmailPage;