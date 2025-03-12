import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaSearch, FaSadTear } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-indigo-100 text-indigo-600 mb-4"
              >
                <FaSadTear size={48} />
              </motion.div>
              <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
              <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
              <p className="mt-3 text-lg text-gray-600">
                The page you're looking for doesn't exist or has been moved.
              </p>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <FaHome className="mr-2" />
                Back to Home
              </Link>
              
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FaSearch className="mr-2" />
                Go to Dashboard
              </Link>
            </div>
            
            <div className="mt-16 max-w-sm mx-auto">
              <p className="text-sm text-gray-500">
                If you believe this is an error, please contact our support team for assistance.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFoundPage;