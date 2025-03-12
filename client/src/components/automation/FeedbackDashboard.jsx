// client/src/components/automation/FeedbackDashboard.jsx
import React, { useEffect, useState } from 'react';
import { FaThumbsUp, FaThumbsDown, FaPen, FaStar, FaChartBar } from 'react-icons/fa';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const FeedbackDashboard = () => {
  const [stats, setStats] = useState(null);
  const [rlhfMetrics, setRlhfMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await api.feedback.getStats();
        
        if (response.success) {
          setStats(response.stats);
          setRlhfMetrics(response.rlhfMetrics);
        } else {
          setError('Failed to load feedback statistics');
        }
      } catch (error) {
        console.error('Error fetching feedback stats:', error);
        setError('Error loading feedback statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
        <p className="text-blue-700">No feedback data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold mb-4">AI Training & Feedback</h2>
      
      {/* RLHF Status Card */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">RLHF Training Status</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="mt-1 text-2xl font-semibold">
                {rlhfMetrics?.trainingStatus === 'in_progress' ? (
                  <span className="text-amber-600">Training</span>
                ) : (
                  <span className="text-green-600">Ready</span>
                )}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Training Examples</p>
              <p className="mt-1 text-2xl font-semibold">{rlhfMetrics?.totalExamplesUsed || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Last Training</p>
              <p className="mt-1 text-sm">
                {rlhfMetrics?.lastTrainingTime ? (
                  new Date(rlhfMetrics.lastTrainingTime).toLocaleString()
                ) : (
                  'Never'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Feedback Summary */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Feedback Summary</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Total Feedback</p>
              <p className="mt-1 text-2xl font-semibold">{stats.total}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">
                <FaThumbsUp className="inline mr-2" />
                {stats.byType.approve || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Needs Improvement</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">
                <FaThumbsDown className="inline mr-2" />
                {stats.byType.reject || 0}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-500">Edited</p>
              <p className="mt-1 text-2xl font-semibold text-blue-600">
                <FaPen className="inline mr-2" />
                {stats.byType.edit || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating and Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Average Rating</h3>
            <div className="mt-4 flex items-center">
              <div className="text-3xl font-bold mr-3">
                {stats.rating.average ? stats.rating.average.toFixed(1) : 'N/A'}
              </div>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar 
                    key={star}
                    className={`h-6 w-6 ${
                      stats.rating.average && star <= Math.round(stats.rating.average) 
                        ? 'text-yellow-400' 
                        : 'text-gray-300'
                    }`} 
                  />
                ))}
              </div>
              <div className="ml-3 text-sm text-gray-500">
                ({stats.rating.count} ratings)
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900">Top Improvement Areas</h3>
            <div className="mt-4 space-y-3">
              {Object.entries(stats.improvements || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([area, count]) => (
                  <div key={area} className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-900 w-36">
                      {area.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
                      {count}
                    </span>
                  </div>
                ))}
              
              {(!stats.improvements || Object.keys(stats.improvements).length === 0) && (
                <p className="text-sm text-gray-500">No improvement data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;