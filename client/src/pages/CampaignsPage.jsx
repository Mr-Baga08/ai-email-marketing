import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaPlus, 
  FaSearch, 
  FaFilter, 
  FaPaperPlane, 
  FaPencilAlt, 
  FaTrashAlt, 
  FaChartBar,
  FaEllipsisH,
  FaTimes,
  FaRegCheckCircle,
  FaRegClock,
  FaRegTimesCircle,
  FaRegPauseCircle
} from 'react-icons/fa';
import DashboardLayout from '../components/layout/DashboardLayout';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import api from '../services/api';

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigate = useNavigate();

  // Campaign status icons and colors
  const statusIcons = {
    draft: { icon: <FaRegClock />, color: 'text-gray-500', bgColor: 'bg-gray-100' },
    scheduled: { icon: <FaRegClock />, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    sending: { icon: <FaPaperPlane />, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
    completed: { icon: <FaRegCheckCircle />, color: 'text-green-500', bgColor: 'bg-green-100' },
    paused: { icon: <FaRegPauseCircle />, color: 'text-purple-500', bgColor: 'bg-purple-100' },
    failed: { icon: <FaRegTimesCircle />, color: 'text-red-500', bgColor: 'bg-red-100' }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, filterStatus, filterType]);

  useEffect(() => {
    if (campaigns.length > 0) {
      applyFilters();
    }
  }, [campaigns, searchTerm]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = { 
        page, 
        limit: 10,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        type: filterType !== 'all' ? filterType : undefined
      };
      
      const response = await api.campaigns.getAll(params);
      
      setCampaigns(response.campaigns);
      setTotalCampaigns(response.pagination.total);
      setTotalPages(response.pagination.pages);
      
      // Set filtered campaigns initially to all campaigns
      setFilteredCampaigns(response.campaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...campaigns];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(campaign => 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCampaigns(result);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setFilterStatus(status);
    setPage(1);
  };

  const handleTypeFilter = (type) => {
    setFilterType(type);
    setPage(1);
  };

  const handleDeleteClick = (campaign) => {
    setCampaignToDelete(campaign);
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;
    
    try {
      await api.campaigns.delete(campaignToDelete._id);
      
      // Update local state
      setCampaigns(prev => prev.filter(c => c._id !== campaignToDelete._id));
      setFilteredCampaigns(prev => prev.filter(c => c._id !== campaignToDelete._id));
      setTotalCampaigns(prev => prev - 1);
      
      // Close dialog
      setShowConfirmDelete(false);
      setCampaignToDelete(null);
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError('Failed to delete campaign. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmDelete(false);
    setCampaignToDelete(null);
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await api.campaigns.send(campaignId);
      
      // Update the campaign status in the list
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign._id === campaignId 
            ? { ...campaign, status: 'sending' } 
            : campaign
        )
      );
      
      // Also update in filtered campaigns
      setFilteredCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => 
          campaign._id === campaignId 
            ? { ...campaign, status: 'sending' } 
            : campaign
        )
      );
    } catch (err) {
      console.error('Error sending campaign:', err);
      setError('Failed to send campaign. Please try again.');
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setSearchTerm('');
    setPage(1);
  };

  const handlePagination = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        {/* Page header */}
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          {/* Left: Title */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Email Campaigns</h1>
          </div>

          {/* Right: Actions */}
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
            <Link
              to="/campaigns/new"
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              <span>Create Campaign</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <div className="flex flex-wrap gap-2 md:items-center">
            <div className="relative w-full md:w-64">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search campaigns"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <button 
              onClick={toggleFilters}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaFilter className="mr-2 text-gray-500" />
              <span>Filters</span>
              {(filterStatus !== 'all' || filterType !== 'all') && 
                <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Active
                </span>
              }
            </button>
            
            {showFilters && (
              <motion.div 
                className="w-full mt-3 p-4 bg-white border rounded-lg shadow-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-700">Filter Campaigns</h3>
                  <button 
                    onClick={toggleFilters} 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterStatus}
                      onChange={(e) => handleStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="sending">Sending</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={filterType}
                      onChange={(e) => handleTypeFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="regular">Regular</option>
                      <option value="automated">Automated</option>
                      <option value="ai-generated">AI-Generated</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 mr-2"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={toggleFilters}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaRegTimesCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns table */}
        {loading ? (
          <Loader text="Loading campaigns..." />
        ) : filteredCampaigns.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-left">Campaign</div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-center">Status</div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-center">Type</div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-center">Sent/Total</div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-center">Open Rate</div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-center">Created</div>
                    </th>
                    <th className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-center">Actions</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {filteredCampaigns.map((campaign) => {
                    const statusConfig = statusIcons[campaign.status] || statusIcons.draft;
                    const openRate = campaign.stats && campaign.stats.total > 0
                      ? Math.round((campaign.stats.opened / campaign.stats.total) * 100)
                      : 0;
                      
                    return (
                      <tr key={campaign._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="text-gray-800 font-medium">{campaign.name}</div>
                          </div>
                          <div className="text-gray-500 text-xs mt-1">{campaign.subject}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                              {statusConfig.icon}
                              <span className="ml-1 capitalize">{campaign.status}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-gray-700 capitalize">{campaign.type || 'regular'}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-gray-700">
                            {campaign.stats ? `${campaign.stats.sent}/${campaign.stats.total}` : '0/0'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-gray-700">
                            {openRate}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-gray-700">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => handleSendCampaign(campaign._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Send Campaign"
                              >
                                <FaPaperPlane />
                              </button>
                            )}
                            
                            <button
                              onClick={() => navigate(`/campaigns/${campaign._id}/stats`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Statistics"
                            >
                              <FaChartBar />
                            </button>
                            
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => navigate(`/campaigns/${campaign._id}/edit`)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit Campaign"
                              >
                                <FaPencilAlt />
                              </button>
                            )}
                            
                            {['draft', 'completed', 'failed'].includes(campaign.status) && (
                              <button
                                onClick={() => handleDeleteClick(campaign)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Campaign"
                              >
                                <FaTrashAlt />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePagination(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePagination(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * 10, totalCampaigns)}
                      </span>{' '}
                      of <span className="font-medium">{totalCampaigns}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePagination(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(pageNum => {
                          // Show current page, first page, last page, and pages around current page
                          return pageNum === 1 || 
                                 pageNum === totalPages || 
                                 (pageNum >= page - 1 && pageNum <= page + 1);
                        })
                        .map((pageNum, i, filteredPages) => {
                          // Add ellipsis where needed
                          const showEllipsisBefore = i > 0 && filteredPages[i - 1] !== pageNum - 1;
                          const showEllipsisAfter = i < filteredPages.length - 1 && filteredPages[i + 1] !== pageNum + 1;
                          
                          return (
                            <React.Fragment key={pageNum}>
                              {showEllipsisBefore && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                              
                              <button
                                onClick={() => handlePagination(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageNum
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                              
                              {showEllipsisAfter && (
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      
                      <button
                        onClick={() => handlePagination(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState
            title="No campaigns found"
            description={searchTerm || filterStatus !== 'all' || filterType !== 'all' ? 
              "Try adjusting your search or filters to find what you're looking for." : 
              "Create your first email campaign to get started."}
            action={{
              label: "Create Campaign",
              onClick: () => navigate('/campaigns/new')
            }}
            icon={<FaPaperPlane className="h-12 w-12 text-indigo-400" />}
          />
        )}
      </div>

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete the campaign "${campaignToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        confirmVariant="danger"
      />
    </DashboardLayout>
  );
};

export default CampaignsPage;