// client/src/services/api.js
import axios from 'axios';

// Create a base axios instance with consistent configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
const auth = {
  register: (userData) => apiClient.post('/auth/register', userData),
  login: (credentials) => apiClient.post('/auth/login', credentials),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (userData) => apiClient.put('/auth/profile', userData),
  changePassword: (passwordData) => apiClient.put('/auth/change-password', passwordData),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', email),
  updateNotifications: (notificationSettings) => apiClient.put('/auth/notifications', notificationSettings)
};

// Campaigns API
const campaigns = {
  getAll: (params) => apiClient.get('/campaigns', { params }),
  getById: (id) => apiClient.get(`/campaigns/${id}`),
  create: (campaignData) => apiClient.post('/campaigns', campaignData),
  update: (id, campaignData) => apiClient.put(`/campaigns/${id}`, campaignData),
  delete: (id) => apiClient.delete(`/campaigns/${id}`),
  send: (id) => apiClient.post(`/campaigns/${id}/send`),
  getStats: (id) => apiClient.get(`/campaigns/${id}/stats`),
  sendTest: (testData) => apiClient.post('/emails/test', testData),
  generateAIContent: (promptData) => apiClient.post('/campaigns/generate-content', promptData)
};

// Contacts API
const contacts = {
  getLists: () => apiClient.get('/contacts/lists'),
  getListById: (id) => apiClient.get(`/contacts/lists/${id}`),
  createList: (listData) => apiClient.post('/contacts/lists', listData),
  updateList: (id, listData) => apiClient.put(`/contacts/lists/${id}`, listData),
  deleteList: (id) => apiClient.delete(`/contacts/lists/${id}`),
  getContactsFromList: (listId, params) => apiClient.get(`/contacts/lists/${listId}/contacts`, { params }),
  addContactToList: (listId, contactData) => apiClient.post(`/contacts/lists/${listId}/contacts`, contactData),
  removeContactFromList: (listId, contactId) => apiClient.delete(`/contacts/lists/${listId}/contacts/${contactId}`),
  uploadContacts: (formData) => {
    return apiClient.post('/contacts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Automation API
const automation = {
  startAutomation: (params) => apiClient.post('/automation/start', params),
  stopAutomation: () => apiClient.post('/automation/stop'),
  getStatus: () => apiClient.get('/automation/status'),
  getEmailHistory: (params) => apiClient.get('/automation/history', { params }),
  getEmail: (id) => apiClient.get(`/automation/emails/${id}`),
  sendResponse: (id, responseData) => apiClient.post(`/automation/emails/${id}/send`, responseData),
  addToKnowledgeBase: (entryData) => apiClient.post('/automation/knowledge-base', entryData),
  getKnowledgeBase: () => apiClient.get('/automation/knowledge-base'),
  deleteKnowledgeBaseEntry: (id) => apiClient.delete(`/automation/knowledge-base/${id}`)
};

// Knowledge Base API
const knowledgeBase = {
  getAll: () => apiClient.get('/knowledge-base'),
  getById: (id) => apiClient.get(`/knowledge-base/${id}`),
  create: (entryData) => apiClient.post('/knowledge-base', entryData),
  update: (id, entryData) => apiClient.put(`/knowledge-base/${id}`, entryData),
  delete: (id) => apiClient.delete(`/knowledge-base/${id}`),
  search: (query) => apiClient.get(`/knowledge-base/search?query=${encodeURIComponent(query)}`),
  getCategories: () => apiClient.get('/knowledge-base/categories'),
  bulkImport: (entriesData) => apiClient.post('/knowledge-base/bulk', entriesData)
};

// Feedback API
const feedbackAPI = {
  submit: (feedbackData) => apiClient.post('/feedback', feedbackData),
  getHistory: () => apiClient.get('/feedback'),
  getStats: () => apiClient.get('/feedback/stats')
};

// Integrations API
const integrations = {
  verifyEmailCredentials: (credentials) => apiClient.post('/integrations/email/verify', credentials),
  getEmailIntegrationStatus: () => apiClient.get('/integrations/email/status'),
  disconnectEmailIntegration: () => apiClient.delete('/integrations/email'),
  initiateOAuth: (provider) => apiClient.get(`/integrations/oauth/${provider}`),
  completeOAuth: (provider, code) => apiClient.post(`/integrations/oauth/${provider}/callback`, { code }),
  refreshOAuthToken: (provider) => apiClient.post(`/integrations/oauth/${provider}/refresh`)
};

// Subscriptions API
const subscriptions = {
  getCurrent: () => apiClient.get('/subscriptions'),
  update: (subscriptionData) => apiClient.put('/subscriptions', subscriptionData),
  cancel: () => apiClient.delete('/subscriptions'),
  getPlans: () => apiClient.get('/subscriptions/plans'),
  getHistory: () => apiClient.get('/subscriptions/history'),
  createCheckoutSession: (planData) => apiClient.post('/subscriptions/checkout', planData),
  getUsageStats: () => apiClient.get('/subscriptions/usage')
};

// Dashboard API
const dashboard = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getEmailActivity: () => apiClient.get('/dashboard/email-activity'),
  getRecentCampaigns: () => apiClient.get('/dashboard/recent-campaigns'),
  getContactLists: () => apiClient.get('/dashboard/contact-lists'),
  getAutomationStatus: () => apiClient.get('/dashboard/automation'),
  getSummary: () => apiClient.get('/dashboard')
};

// Unified API object
const api = {
  auth,
  campaigns,
  contacts,
  automation,
  knowledgeBase,
  feedback: feedbackAPI,
  integrations,
  subscriptions,
  dashboard
};

export default api;