// client/src/services/api.js
import axios from 'axios';

// Create axios instance
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set up interceptor for token authentication
const setAuthToken = (token) => {
  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete instance.defaults.headers.common['Authorization'];
  }
};

const feedback = {
    submit: async (feedbackData) => {
      const response = await instance.post('/feedback', feedbackData);
      return response.data;
    },
    
    getHistory: async () => {
      const response = await instance.get('/feedback');
      return response.data;
    },
    
    getStats: async () => {
      const response = await instance.get('/feedback/stats');
      return response.data;
    }
  };

// Auth API
const auth = {
  register: async (userData) => {
    const response = await instance.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await instance.post('/auth/login', credentials);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await instance.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await instance.put('/auth/profile', userData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await instance.put('/auth/change-password', passwordData);
    return response.data;
  },

  updateNotifications: async (notificationSettings) => {
    const response = await instance.put('/auth/notifications', notificationSettings);
    return response.data;
  }
};

// Subscriptions API
const subscriptions = {
  get: async () => {
    const response = await instance.get('/subscriptions');
    return response.data;
  },
  
  update: async (subscriptionData) => {
    const response = await instance.put('/subscriptions', subscriptionData);
    return response.data;
  }
};

// Campaigns API
const campaigns = {
  getAll: async (params) => {
    const response = await instance.get('/campaigns', { params });
    return response.data;
  },
  
  get: async (id) => {
    const response = await instance.get(`/campaigns/${id}`);
    return response.data;
  },
  
  create: async (campaignData) => {
    const response = await instance.post('/campaigns', campaignData);
    return response.data;
  },
  
  update: async (id, campaignData) => {
    const response = await instance.put(`/campaigns/${id}`, campaignData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await instance.delete(`/campaigns/${id}`);
    return response.data;
  },
  
  send: async (id) => {
    const response = await instance.post(`/campaigns/${id}/send`);
    return response.data;
  },
  
  getStats: async (id) => {
    const response = await instance.get(`/campaigns/${id}/stats`);
    return response.data;
  }
};

// Contacts API
const contacts = {
  getLists: async () => {
    const response = await instance.get('/contacts/lists');
    return response.data;
  },
  
  getList: async (id) => {
    const response = await instance.get(`/contacts/lists/${id}`);
    return response.data;
  },
  
  createList: async (listData) => {
    const response = await instance.post('/contacts/lists', listData);
    return response.data;
  },
  
  updateList: async (id, listData) => {
    const response = await instance.put(`/contacts/lists/${id}`, listData);
    return response.data;
  },
  
  deleteList: async (id) => {
    const response = await instance.delete(`/contacts/lists/${id}`);
    return response.data;
  },
  
  uploadContacts: async (formData) => {
    const response = await instance.post('/contacts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getContactsFromList: async (listId, params) => {
    const response = await instance.get(`/contacts/lists/${listId}/contacts`, { params });
    return response.data;
  },
  
  addContactToList: async (listId, contactData) => {
    const response = await instance.post(`/contacts/lists/${listId}/contacts`, contactData);
    return response.data;
  },
  
  removeContactFromList: async (listId, contactId) => {
    const response = await instance.delete(`/contacts/lists/${listId}/contacts/${contactId}`);
    return response.data;
  }
};

// Automation API
const automation = {
  getStatus: async () => {
    const response = await instance.get('/automation/status');
    return response.data;
  },
  
  start: async (options) => {
    const response = await instance.post('/automation/start', options);
    return response.data;
  },
  
  stop: async () => {
    const response = await instance.post('/automation/stop');
    return response.data;
  },
  
  getHistory: async (params) => {
    const response = await instance.get('/automation/history', { params });
    return response.data;
  },
  
  getEmail: async (id) => {
    const response = await instance.get(`/automation/emails/${id}`);
    return response.data;
  },
  
  sendResponse: async (id, responseData) => {
    const response = await instance.post(`/automation/emails/${id}/send`, responseData);
    return response.data;
  },
  
  getKnowledgeBase: async () => {
    const response = await instance.get('/automation/knowledge-base');
    return response.data;
  },
  
  addToKnowledgeBase: async (entryData) => {
    const response = await instance.post('/automation/knowledge-base', entryData);
    return response.data;
  },
  
  deleteKnowledgeBaseEntry: async (id) => {
    const response = await instance.delete(`/automation/knowledge-base/${id}`);
    return response.data;
  }
};

// Email integrations API
const integrations = {
  verifyEmailCredentials: async (data) => {
    const response = await instance.post('/integrations/email/verify', data);
    return response.data;
  },
  
  initiateOAuth: async (provider) => {
    const response = await instance.get(`/integrations/oauth/${provider}`);
    return response.data;
  },
  
  completeOAuth: async (provider, code) => {
    const response = await instance.post(`/integrations/oauth/${provider}/callback`, { code });
    return response.data;
  },
  
  getEmailIntegrationStatus: async () => {
    const response = await instance.get('/integrations/email/status');
    return response.data;
  },
  
  disconnectEmailIntegration: async () => {
    const response = await instance.delete('/integrations/email');
    return response.data;
  }

  
};

export default {
    setAuthToken,
    auth,
    subscriptions,
    campaigns,
    contacts,
    automation,
    integrations,
    feedback  // Add this
  };