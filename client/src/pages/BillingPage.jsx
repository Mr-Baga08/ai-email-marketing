import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FaCreditCard, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const BillingPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [billingAddress, setBillingAddress] = useState({});

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        // In a real app, you'd fetch this from your API
        // const response = await api.billing.getInfo();
        
        // For demo purposes, we'll use mock data
        setTimeout(() => {
          setPaymentMethods([
            {
              id: 'card_123',
              type: 'visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2025,
              isDefault: true
            }
          ]);
          
          setBillingAddress({
            name: user?.name || '',
            line1: '123 Main St',
            line2: 'Suite 101',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US'
          });
          
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching billing info:', error);
        setLoading(false);
      }
    };
    
    fetchBillingInfo();
  }, [user]);

  return (
    <DashboardLayout title="Billing" subtitle="Manage your payment methods and billing information">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Payment Methods */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Payment Methods</h2>
            </div>
            <div className="px-6 py-4">
              {paymentMethods.length > 0 ? (
                <div className="space-y-4">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center">
                        <FaCreditCard className="text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium">
                            {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ending in {method.last4}
                          </p>
                          <p className="text-sm text-gray-500">
                            Expires {method.expMonth}/{method.expYear}
                          </p>
                        </div>
                      </div>
                      <div>
                        {method.isDefault && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4">
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Add Payment Method
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No payment methods found</p>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Add Payment Method
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Billing Address */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">Billing Address</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-1 mb-4">
                <p className="font-medium">{billingAddress.name}</p>
                <p>{billingAddress.line1}</p>
                {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                <p>{`${billingAddress.city}, ${billingAddress.state} ${billingAddress.postalCode}`}</p>
                <p>{billingAddress.country}</p>
              </div>
              
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Edit Address
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BillingPage;