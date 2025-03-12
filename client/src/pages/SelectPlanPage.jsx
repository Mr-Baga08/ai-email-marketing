// client/src/pages/SelectPlanPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheck, FaInfoCircle } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PlanCard from '../components/ui/PlanCard';
import FeatureList from '../components/ui/FeatureList';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SelectPlanPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [includeAI, setIncludeAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  // Plan data
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: [
        'Up to 1,000 contacts',
        'Basic email campaigns',
        'Standard templates',
        'Basic reporting',
        'Email support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 79,
      features: [
        'Up to 10,000 contacts',
        'Advanced segmentation',
        'Custom templates',
        'A/B testing',
        'Advanced analytics',
        'Priority support'
      ],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 249,
      features: [
        'Unlimited contacts',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced security',
        'SLA guarantees',
        '24/7 phone support'
      ]
    }
  ];

  // AI addon features
const aiFeatures = [
    '24/7 inbox monitoring',
    'Automatic email classification',
    'AI-powered responses',
    'Knowledge base integration',
    'Human review workflow',
    'Custom training'
  ];
  
  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      setError('Please select a plan to continue');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Update user subscription
      const response = await api.subscriptions.update({
        plan: selectedPlan,
        aiEmailAutomation: includeAI
      });
      
      // Update user context with new subscription info
      updateUser({ subscription: response.subscription });
      
      // Navigate to email provider selection
      navigate('/setup-email');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
              <p className="text-lg text-gray-600">
                Select the plan that best fits your business needs. You can upgrade or downgrade at any time.
              </p>
            </div>
            
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              {/* Plan Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    id={plan.id}
                    name={plan.name}
                    price={plan.price}
                    features={plan.features}
                    recommended={plan.recommended}
                    selected={selectedPlan === plan.id}
                    onSelect={handlePlanSelect}
                  />
                ))}
              </div>
              
              {/* AI Add-on */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-200 mb-10">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h2 className="text-xl font-bold mr-2">AI Email Automation</h2>
                      <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                        Premium Add-on
                      </span>
                    </div>
                    
                    <p className="text-gray-600 my-3">
                      Add AI-powered email automation to supercharge your customer service with 24/7 response capabilities.
                    </p>
                    
                    <FeatureList features={aiFeatures} />
                  </div>
                  
                  <div className="ml-6 text-center">
                    <div className="text-2xl font-bold">$1,000</div>
                    <div className="text-sm text-gray-500 mb-4">per month</div>
                    
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={includeAI}
                        onChange={() => setIncludeAI(!includeAI)}
                      />
                      <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-900">Add AI Email Automation</span>
                    </label>
                  </div>
                </div>
                
                {includeAI && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md flex items-start">
                    <FaInfoCircle className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-700">
                      AI Email Automation requires connection to your email provider. You'll set this up in the next step after selecting your plan.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isLoading || !selectedPlan}
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Continue to Email Setup'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
  };
  
  export default SelectPlanPage;