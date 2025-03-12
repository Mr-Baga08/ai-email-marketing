// client/src/pages/InvoicesPage.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FaDownload, FaSpinner, FaFileInvoice } from 'react-icons/fa';
import api from '../services/api';

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        // In a real app, you'd fetch this from your API
        // const response = await api.billing.getInvoices();
        
        // For demo purposes, we'll use mock data
        setTimeout(() => {
          setInvoices([
            {
              id: 'inv_123',
              number: 'INV-001',
              date: '2023-05-01',
              amount: 79,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'inv_124',
              number: 'INV-002',
              date: '2023-06-01',
              amount: 79,
              status: 'paid',
              downloadUrl: '#'
            },
            {
              id: 'inv_125',
              number: 'INV-003',
              date: '2023-07-01',
              amount: 79,
              status: 'paid',
              downloadUrl: '#'
            }
          ]);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setLoading(false);
      }
    };
    
    fetchInvoices();
  }, []);

  return (
    <DashboardLayout title="Invoices" subtitle="View and download your past invoices">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-indigo-600 text-4xl" />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FaFileInvoice className="mr-2 text-gray-400" />
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.number}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(invoice.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${invoice.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={invoice.downloadUrl} className="text-indigo-600 hover:text-indigo-900">
                          <FaDownload />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaFileInvoice className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't been billed yet. Invoices will appear here once you've been charged.
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default InvoicesPage;