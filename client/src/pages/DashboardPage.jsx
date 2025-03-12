import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaEnvelope, 
  FaUsers, 
  FaChartLine, 
  FaRobot, 
  FaPaperPlane, 
  FaRegClock, 
  FaUserPlus, 
  FaFileUpload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowRight,
  FaPlus
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import StatCard from '../components/ui/StatCard';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import Loader from '../components/ui/Loader';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalCampaigns: 0,
    totalSent: 0,
    openRate: 0,
    clickRate: 0
  });
  const [emailActivity, setEmailActivity] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [topLists, setTopLists] = useState([]);
  const [automationStatus, setAutomationStatus] = useState({
    active: false,
    stats: {
      totalProcessed: 0,
      totalResponded: 0,
      avgResponseTime: 0
    }
  });
  const [error, setError] = useState('');
  const [emailPerformanceData, setEmailPerformanceData] = useState([]);
  const [campaignTypeData, setCampaignTypeData] = useState([]);

  // Check if the AI Email Automation feature is enabled
  const hasAIEmailAutomation = user?.subscription?.aiEmailAutomation || false;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use Promise.all to fetch data in parallel
      const [statsResponse, activityResponse, campaignsResponse, listsResponse] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getEmailActivity(),
        api.campaigns.getAll({ limit: 5, sort: 'createdAt:desc' }),
        api.contacts.getLists()
      ]);
      
      // Update stats
      setStats(statsResponse);
      
      // Update email activity
      setEmailActivity(activityResponse.activity);
      
      // Update recent campaigns
      setRecentCampaigns(campaignsResponse.campaigns);
      
      // Sort lists by contact count and get top 5
      const sortedLists = listsResponse.sort((a, b) => (b.contactCount || 0) - (a.contactCount || 0)).slice(0, 5);
      setTopLists(sortedLists);
      
      // Check AI automation status if enabled
      if (hasAIEmailAutomation) {
        try {
          const automationResponse = await api.automation.getStatus();
          setAutomationStatus({
            active: automationResponse.status === 'running',
            stats: automationResponse.stats
          });
        } catch (err) {
          console.error('Error fetching automation status:', err);
          // Don't set global error for this, just log it
        }
      }
      
      // Set email performance chart data
      setEmailPerformanceData([
        { name: 'Jan', sent: 65, opened: 45, clicked: 28 },
        { name: 'Feb', sent: 85, opened: 50, clicked: 32 },
        { name: 'Mar', sent: 120, opened: 65, clicked: 42 },
        { name: 'Apr', sent: 90, opened: 48, clicked: 25 },
        { name: 'May', sent: 110, opened: 68, clicked: 37 },
        { name: 'Jun', sent: 145, opened: 80, clicked: 50 }
      ]);
      
      // Set campaign type distribution data
      setCampaignTypeData([
        { name: 'Regular', value: 60 },
        { name: 'Automated', value: 25 },
        { name: 'AI-Generated', value: 15 }
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen -mt-16">
          <Loader text="Loading dashboard data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Here's an overview of your email marketing activities.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick action buttons for mobile */}
        <div className="md:hidden mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/campaigns/new"
              className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:bg-indigo-50 transition-colors"
            >
              <FaPaperPlane className="text-indigo-500 h-6 w-6 mb-2" />
              <span className="text-sm font-medium text-gray-800">New Campaign</span>
            </Link>
            <Link
              to="/contacts"
              className="flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:bg-green-50 transition-colors"
            >
              <FaUserPlus className="text-green-500 h-6 w-6 mb-2" />
              <span className="text-sm font-medium text-gray-800">Add Contacts</span>
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatCard
              title="Total Contacts"
              value={stats.totalContacts.toLocaleString()}
              icon={<FaUsers className="h-6 w-6 text-blue-500" />}
              change={{ value: 12, label: '% from last month' }}
              to="/contacts"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatCard
              title="Campaigns"
              value={stats.totalCampaigns.toLocaleString()}
              icon={<FaPaperPlane className="h-6 w-6 text-indigo-500" />}
              to="/campaigns"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatCard
              title="Emails Sent"
              value={stats.totalSent.toLocaleString()}
              icon={<FaEnvelope className="h-6 w-6 text-purple-500" />}
              change={{ value: 8.2, label: '% from last week' }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <StatCard
              title="Open Rate"
              value={`${stats.openRate}%`}
              icon={<FaChartLine className="h-6 w-6 text-green-500" />}
              change={{ value: 1.8, label: '% from last month', isPositive: true }}
            />
          </motion.div>
        </div>

        {/* AI Email Automation status card (show only if enabled) */}
        {hasAIEmailAutomation && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-3">
                    <FaRobot className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-white">AI Email Automation</h3>
                    <div className="flex items-center mt-1">
                      {automationStatus.active ? (
                        <>
                          <span className="h-3 w-3 bg-green-400 rounded-full inline-block mr-2 animate-pulse"></span>
                          <span className="text-white text-opacity-90">Active & Monitoring</span>
                        </>
                      ) : (
                        <>
                          <span className="h-3 w-3 bg-gray-300 rounded-full inline-block mr-2"></span>
                          <span className="text-white text-opacity-90">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{automationStatus.stats.totalProcessed}</div>
                    <div className="text-sm text-white text-opacity-80">Emails Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{automationStatus.stats.totalResponded}</div>
                    <div className="text-sm text-white text-opacity-80">Auto-Responses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{automationStatus.stats.avgResponseTime}m</div>
                    <div className="text-sm text-white text-opacity-80">Avg. Response Time</div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0">
                  <Link
                    to="/automation"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Manage Automation <FaArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email setup reminder if not set up */}
        {!user?.emailIntegration?.verified && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Email setup required</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      You haven't connected your email account yet. Set up your email provider to start sending campaigns.
                    </p>
                  </div>
                  <div className="mt-4">
                    <Link
                      to="/settings/email"
                      className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                    >
                      Setup Email <FaArrowRight className="inline-block ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main content - 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Charts */}
          <div className="space-y-8">
            {/* Email Performance Chart */}
            <motion.div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Email Performance</h3>
                <div className="mt-4 h-72">
                  <LineChart 
                    data={emailPerformanceData}
                    lines={[
                      { name: 'sent', color: '#6366F1' },
                      { name: 'opened', color: '#10B981' },
                      { name: 'clicked', color: '#F59E0B' }
                    ]}
                  />
                </div>
              </div>
            </motion.div>
            
            {/* Campaign Types Pie Chart */}
            <motion.div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Campaign Types</h3>
                <div className="mt-4 h-64 flex items-center justify-center">
                  <PieChart 
                    data={campaignTypeData}
                    colors={['#6366F1', '#10B981', '#8B5CF6']}
                  />
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Right column - Lists and activity */}
          <div className="space-y-8">
            {/* Recent Campaigns */}
            <motion.div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Campaigns</h3>
                <Link
                  to="/campaigns"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View all
                </Link>
              </div>
              <div className="border-t border-gray-200 divide-y divide-gray-200">
                {recentCampaigns.length > 0 ? (
                  recentCampaigns.map((campaign) => {
                    // Determine status icon and color
                    let StatusIcon = FaRegClock;
                    let statusColor = 'text-gray-500';
                    
                    if (campaign.status === 'completed') {
                      StatusIcon = FaCheckCircle;
                      statusColor = 'text-green-500';
                    } else if (campaign.status === 'sending') {
                      StatusIcon = FaPaperPlane;
                      statusColor = 'text-yellow-500';
                    } else if (campaign.status === 'failed') {
                      StatusIcon = FaExclamationTriangle;
                      statusColor = 'text-red-500';
                    }
                    
                    return (
                      <div key={campaign._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <Link to={`/campaigns/${campaign._id}`} className="block">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {campaign.name}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                statusColor === 'text-green-500' 
                                  ? 'bg-green-100 text-green-800'
                                  : statusColor === 'text-yellow-500'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : statusColor === 'text-red-500'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                <StatusIcon className={`inline-block mr-1 ${statusColor}`} />
                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <FaEnvelope className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {campaign.stats?.sent || 0}/{campaign.stats?.total || 0} sent
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                <FaChartLine className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                {campaign.stats?.openRate || 0}% open rate
                              </p>
                            </div>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <FaRegClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {new Date(campaign.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-12 text-center">
                    <FaPaperPlane className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No campaigns yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new campaign.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/campaigns/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        New Campaign
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Top Contact Lists */}
            <motion.div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 }}
            >
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Top Contact Lists</h3>
                <Link
                  to="/contacts"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Manage Lists
                </Link>
              </div>
              <div className="border-t border-gray-200">
                {topLists.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {topLists.map((list) => (
                      <li key={list._id}>
                        <Link to={`/contacts?list=${list._id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-indigo-600 truncate">
                                {list.name}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {list.contactCount || 0} contacts
                                </p>
                              </div>
                            </div>
                            {list.description && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500 truncate">
                                  {list.description}
                                </p>
                              </div>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-12 text-center">
                    <FaUsers className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No contact lists</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new contact list.
                    </p>
                    <div className="mt-6">
                      <Link
                        to="/contacts"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <FaPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        New Contact List
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Recent Activity */}
            <motion.div
              className="bg-white rounded-lg shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
            >
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="border-t border-gray-200">
                <ActivityFeed activities={emailActivity} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;