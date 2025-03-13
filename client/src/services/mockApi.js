import { v4 as uuidv4 } from 'uuid';

// Helper to simulate async API calls
const asyncResponse = (data, delay = 500, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('API request failed'));
      } else {
        resolve({ data });
      }
    }, delay);
  });
};

// Mock data storage
const mockData = {
  user: {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Example Inc',
    emailIntegration: {
      provider: 'titan',
      verified: true,
      credentials: {
        email: 'john@example.com'
      }
    },
    subscription: {
      plan: 'premium',
      status: 'active',
      aiEmailAutomation: true,
      startDate: new Date().toISOString(),
      features: [
        { name: 'basic_email_campaigns', active: true },
        { name: 'advanced_campaigns', active: true },
        { name: 'contact_management', active: true, limit: 10000 },
        { name: 'advanced_segmentation', active: true },
        { name: 'template_editor', active: true },
        { name: 'custom_templates', active: true },
        { name: 'a_b_testing', active: true },
        { name: 'advanced_reporting', active: true },
        { name: 'priority_support', active: true }
      ]
    },
    settings: {
      aiSettings: {
        temperature: 0.7,
        model: 'gemini-pro',
        autoRespond: true,
        reviewThreshold: 0.7
      },
      notifications: {
        emailNotifications: true,
        campaignReports: true,
        automationAlerts: true,
        marketingUpdates: false
      }
    }
  },
  campaigns: [
    {
      _id: 'camp1',
      name: 'Summer Sale Announcement',
      subject: 'Don\'t Miss Our Summer Sale - Up to 50% Off!',
      status: 'completed',
      type: 'regular',
      createdAt: '2023-06-01T00:00:00.000Z',
      stats: {
        total: 1000,
        sent: 998,
        opened: 423,
        clicked: 187,
        bounced: 2,
        unsubscribed: 5,
        openRate: 42.3,
        clickRate: 18.7
      }
    },
    {
      _id: 'camp2',
      name: 'Product Update Newsletter',
      subject: 'New Features Just Launched',
      status: 'draft',
      type: 'regular',
      createdAt: '2023-07-10T00:00:00.000Z',
      stats: {
        total: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        openRate: 0,
        clickRate: 0
      }
    },
    {
      _id: 'camp3',
      name: 'Customer Satisfaction Survey',
      subject: 'We Value Your Feedback',
      status: 'scheduled',
      type: 'ai-generated',
      createdAt: '2023-07-15T00:00:00.000Z',
      stats: {
        total: 2500,
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        openRate: 0,
        clickRate: 0
      }
    }
  ],
  contactLists: [
    {
      _id: 'list1',
      name: 'Newsletter Subscribers',
      description: 'People who signed up for our newsletter',
      contactCount: 2500,
      createdAt: '2023-05-15T00:00:00.000Z',
      tags: ['newsletter', 'engaged']
    },
    {
      _id: 'list2',
      name: 'Customers',
      description: 'Active customers',
      contactCount: 1200,
      createdAt: '2023-05-20T00:00:00.000Z',
      tags: ['customers', 'buyers']
    },
    {
      _id: 'list3',
      name: 'Leads',
      description: 'Potential customers from website',
      contactCount: 350,
      createdAt: '2023-06-10T00:00:00.000Z',
      tags: ['leads', 'website']
    }
  ],
  contacts: [
    {
      _id: 'contact1',
      email: 'sarah@example.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      company: 'ABC Corp',
      position: 'Marketing Manager',
      phone: '+1234567890',
      lists: ['list1', 'list2']
    },
    {
      _id: 'contact2',
      email: 'michael@example.com',
      firstName: 'Michael',
      lastName: 'Smith',
      company: 'XYZ Inc',
      position: 'CEO',
      phone: '+1987654321',
      lists: ['list2']
    },
    {
      _id: 'contact3',
      email: 'emma@example.com',
      firstName: 'Emma',
      lastName: 'Williams',
      company: 'Design Studio',
      position: 'Designer',
      phone: '+1122334455',
      lists: ['list1', 'list3']
    }
  ],
  automatedEmails: [
    {
      _id: 'auto1',
      messageId: 'msg123',
      subject: 'Question about subscription',
      from: 'customer@example.com',
      to: 'support@yourcompany.com',
      receivedDate: '2023-07-01T08:30:00.000Z',
      category: 'product_inquiry',
      responseGenerated: true,
      responseSent: true,
      responseText: 'Thank you for your inquiry about our subscription plans...',
      responseDate: '2023-07-01T08:35:00.000Z',
      needsHumanReview: false
    },
    {
      _id: 'auto2',
      messageId: 'msg456',
      subject: 'Complaint about service',
      from: 'unhappy@example.com',
      to: 'support@yourcompany.com',
      receivedDate: '2023-07-02T10:15:00.000Z',
      category: 'customer_complaint',
      responseGenerated: true,
      responseSent: false,
      responseText: 'I apologize for the inconvenience you experienced...',
      needsHumanReview: true
    },
    {
      _id: 'auto3',
      messageId: 'msg789',
      subject: 'Feature suggestion',
      from: 'idea@example.com',
      to: 'support@yourcompany.com',
      receivedDate: '2023-07-03T14:22:00.000Z',
      category: 'customer_feedback',
      responseGenerated: true,
      responseSent: true,
      responseText: 'Thank you for your suggestion about adding this feature...',
      responseDate: '2023-07-03T14:25:00.000Z',
      needsHumanReview: false
    }
  ],
  knowledgeBase: [
    {
      _id: 'kb1',
      content: 'Our premium subscription costs $79 per month and includes up to 10,000 contacts.',
      category: 'Pricing',
      createdAt: '2023-05-10T00:00:00.000Z',
      tags: ['pricing', 'subscription']
    },
    {
      _id: 'kb2',
      content: 'The AI Email Automation add-on works with all subscription plans and costs $1,000 per month.',
      category: 'Pricing',
      createdAt: '2023-05-11T00:00:00.000Z',
      tags: ['pricing', 'ai', 'automation']
    },
    {
      _id: 'kb3',
      content: 'To cancel your subscription, go to Settings > Subscription and click "Cancel Subscription".',
      category: 'Account',
      createdAt: '2023-05-12T00:00:00.000Z',
      tags: ['account', 'billing', 'cancellation']
    }
  ],
  feedback: [
    {
      _id: 'fb1',
      automatedEmail: 'auto1',
      feedbackType: 'approve',
      rating: 5,
      createdAt: '2023-07-01T09:00:00.000Z'
    },
    {
      _id: 'fb2',
      automatedEmail: 'auto2',
      feedbackType: 'edit',
      originalResponse: 'I apologize for the inconvenience you experienced...',
      improvedResponse: 'I sincerely apologize for the inconvenience you experienced. We take customer satisfaction very seriously...',
      createdAt: '2023-07-02T11:00:00.000Z'
    }
  ]
};

// Mock Auth API
const auth = {
  register: (userData) => {
    const newUser = {
      ...mockData.user,
      ...userData,
      _id: uuidv4()
    };
    return asyncResponse({ ...newUser, token: 'mock-token-' + uuidv4() });
  },
  login: (credentials) => {
    // Simulate login
    if (credentials.email && credentials.password) {
      return asyncResponse({ ...mockData.user, token: 'mock-token-' + uuidv4() });
    }
    return asyncResponse(null, 500, true);
  },
  getProfile: () => asyncResponse(mockData.user),
  updateProfile: (userData) => {
    // Update mock user
    mockData.user = { ...mockData.user, ...userData };
    return asyncResponse(mockData.user);
  },
  changePassword: () => asyncResponse({ message: 'Password changed successfully' }),
  forgotPassword: () => asyncResponse({ message: 'Password reset email sent' }),
  updateNotifications: (notificationSettings) => {
    mockData.user.settings.notifications = notificationSettings;
    return asyncResponse(mockData.user);
  }
};

// Mock Campaigns API
const campaigns = {
  getAll: (params) => {
    const { page = 1, limit = 10 } = params || {};
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCampaigns = mockData.campaigns.slice(startIndex, endIndex);
    
    return asyncResponse({
      campaigns: paginatedCampaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockData.campaigns.length,
        pages: Math.ceil(mockData.campaigns.length / limit)
      }
    });
  },
  getById: (id) => {
    const campaign = mockData.campaigns.find(c => c._id === id);
    if (!campaign) {
      return asyncResponse(null, 500, true);
    }
    return asyncResponse(campaign);
  },
  create: (campaignData) => {
    const newCampaign = {
      _id: uuidv4(),
      ...campaignData,
      createdAt: new Date().toISOString(),
      stats: {
        total: 0,
        sent: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0,
        openRate: 0,
        clickRate: 0
      }
    };
    mockData.campaigns.unshift(newCampaign);
    return asyncResponse(newCampaign);
  },
  update: (id, campaignData) => {
    const index = mockData.campaigns.findIndex(c => c._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    const updatedCampaign = { ...mockData.campaigns[index], ...campaignData };
    mockData.campaigns[index] = updatedCampaign;
    return asyncResponse(updatedCampaign);
  },
  delete: (id) => {
    const index = mockData.campaigns.findIndex(c => c._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    mockData.campaigns.splice(index, 1);
    return asyncResponse({ message: 'Campaign deleted successfully' });
  },
  send: (id) => {
    const index = mockData.campaigns.findIndex(c => c._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    mockData.campaigns[index].status = 'sending';
    return asyncResponse({ message: 'Campaign sending started' });
  },
  getStats: (id) => {
    const campaign = mockData.campaigns.find(c => c._id === id);
    if (!campaign) {
      return asyncResponse(null, 500, true);
    }
    return asyncResponse({
      stats: campaign.stats,
      rates: {
        openRate: campaign.stats.openRate,
        clickRate: campaign.stats.clickRate
      },
      emailLogs: []
    });
  },
  sendTest: () => asyncResponse({ success: true, message: 'Test email sent successfully' }),
  generateAIContent: () => asyncResponse({
    suggestions: [
      {
        type: 'subject',
        content: 'Discover Our Latest Products - Just For You!',
        confidence: 0.9
      },
      {
        type: 'content',
        content: 'Hello {firstName},\n\nWe\'re excited to share our latest products with you...',
        confidence: 0.85
      }
    ]
  })
};

// Mock Contacts API
const contacts = {
  getLists: () => asyncResponse(mockData.contactLists),
  getListById: (id) => {
    const list = mockData.contactLists.find(l => l._id === id);
    if (!list) {
      return asyncResponse(null, 500, true);
    }
    return asyncResponse(list);
  },
  createList: (listData) => {
    const newList = {
      _id: uuidv4(),
      ...listData,
      contactCount: 0,
      createdAt: new Date().toISOString(),
      tags: listData.tags ? listData.tags.split(',').map(tag => tag.trim()) : []
    };
    mockData.contactLists.push(newList);
    return asyncResponse(newList);
  },
  updateList: (id, listData) => {
    const index = mockData.contactLists.findIndex(l => l._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    const updatedList = { 
      ...mockData.contactLists[index], 
      ...listData,
      tags: listData.tags ? listData.tags.split(',').map(tag => tag.trim()) : mockData.contactLists[index].tags
    };
    mockData.contactLists[index] = updatedList;
    return asyncResponse(updatedList);
  },
  deleteList: (id) => {
    const index = mockData.contactLists.findIndex(l => l._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    mockData.contactLists.splice(index, 1);
    // Remove list from contacts
    mockData.contacts.forEach(contact => {
      contact.lists = contact.lists.filter(listId => listId !== id);
    });
    return asyncResponse({ message: 'Contact list deleted successfully' });
  },
  getContactsFromList: (listId, params) => {
    const { page = 1, limit = 20, search } = params || {};
    let listContacts = mockData.contacts.filter(c => c.lists.includes(listId));
    
    if (search) {
      const searchLower = search.toLowerCase();
      listContacts = listContacts.filter(c => 
        c.email.toLowerCase().includes(searchLower) ||
        (c.firstName && c.firstName.toLowerCase().includes(searchLower)) ||
        (c.lastName && c.lastName.toLowerCase().includes(searchLower)) ||
        (c.company && c.company.toLowerCase().includes(searchLower))
      );
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = listContacts.slice(startIndex, endIndex);
    
    return asyncResponse({
      contacts: paginatedContacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: listContacts.length,
        pages: Math.ceil(listContacts.length / limit)
      }
    });
  },
  addContactToList: (listId, contactData) => {
    // Check if contact already exists
    let contact = mockData.contacts.find(c => c.email === contactData.email);
    
    if (contact) {
      // Update existing contact
      if (!contact.lists.includes(listId)) {
        contact.lists.push(listId);
      }
      contact = { ...contact, ...contactData };
    } else {
      // Create new contact
      contact = {
        _id: uuidv4(),
        ...contactData,
        lists: [listId]
      };
      mockData.contacts.push(contact);
    }
    
    // Update list count
    const listIndex = mockData.contactLists.findIndex(l => l._id === listId);
    if (listIndex !== -1) {
      mockData.contactLists[listIndex].contactCount += 1;
    }
    
    return asyncResponse(contact);
  },
  removeContactFromList: (listId, contactId) => {
    const contactIndex = mockData.contacts.findIndex(c => c._id === contactId);
    if (contactIndex === -1) {
      return asyncResponse(null, 500, true);
    }
    
    // Remove list from contact
    mockData.contacts[contactIndex].lists = mockData.contacts[contactIndex].lists.filter(id => id !== listId);
    
    // If contact has no lists, remove it
    if (mockData.contacts[contactIndex].lists.length === 0) {
      mockData.contacts.splice(contactIndex, 1);
    }
    
    // Update list count
    const listIndex = mockData.contactLists.findIndex(l => l._id === listId);
    if (listIndex !== -1) {
      mockData.contactLists[listIndex].contactCount = Math.max(0, mockData.contactLists[listIndex].contactCount - 1);
    }
    
    return asyncResponse({ message: 'Contact removed from list' });
  },
  uploadContacts: () => asyncResponse({
    success: true,
    message: 'Contacts imported successfully',
    preview: [
      { email: 'imported1@example.com', firstName: 'Jane', lastName: 'Doe' },
      { email: 'imported2@example.com', firstName: 'John', lastName: 'Smith' }
    ]
  })
};

// Mock Automation API
const automation = {
  startAutomation: () => asyncResponse({ success: true, message: 'Email automation started' }),
  stopAutomation: () => asyncResponse({ success: true, message: 'Email automation stopped' }),
  getStatus: () => asyncResponse({
    success: true,
    status: 'running',
    settings: {
      active: true,
      interval: 5,
      lastStarted: new Date().toISOString()
    },
    stats: {
      totalProcessed: 42,
      totalResponded: 38,
      needsReview: 4,
      avgResponseTime: 3,
      categories: {
        product_inquiry: 25,
        customer_complaint: 10,
        customer_feedback: 7
      }
    }
  }),
  getEmailHistory: (params) => {
    const { page = 1, limit = 20, category } = params || {};
    let emails = [...mockData.automatedEmails];
    
    if (category && category !== 'all') {
      if (category === 'needs_review') {
        emails = emails.filter(email => email.needsHumanReview);
      } else {
        emails = emails.filter(email => email.category === category);
      }
    }
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEmails = emails.slice(startIndex, endIndex);
    
    return asyncResponse({
      success: true,
      data: paginatedEmails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: emails.length,
        pages: Math.ceil(emails.length / limit)
      }
    });
  },
  getEmail: (id) => {
    const email = mockData.automatedEmails.find(e => e._id === id);
    if (!email) {
      return asyncResponse(null, 500, true);
    }
    return asyncResponse({ success: true, email });
  },
  sendResponse: (id, responseData) => {
    const index = mockData.automatedEmails.findIndex(e => e._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    
    mockData.automatedEmails[index].responseText = responseData.responseText;
    mockData.automatedEmails[index].responseSent = true;
    mockData.automatedEmails[index].responseDate = new Date().toISOString();
    mockData.automatedEmails[index].needsHumanReview = false;
    
    return asyncResponse({
      success: true,
      message: 'Response sent successfully',
      email: mockData.automatedEmails[index]
    });
  },
  addToKnowledgeBase: (entryData) => {
    const newEntry = {
      _id: uuidv4(),
      ...entryData,
      createdAt: new Date().toISOString()
    };
    mockData.knowledgeBase.push(newEntry);
    return asyncResponse({
      success: true,
      message: 'Content added to knowledge base',
      entry: newEntry
    });
  },
  getKnowledgeBase: () => asyncResponse({
    success: true,
    entries: mockData.knowledgeBase
  }),
  deleteKnowledgeBaseEntry: (id) => {
    const index = mockData.knowledgeBase.findIndex(kb => kb._id === id);
    if (index === -1) {
      return asyncResponse(null, 500, true);
    }
    mockData.knowledgeBase.splice(index, 1);
    return asyncResponse({
      success: true,
      message: 'Knowledge base entry deleted successfully'
    });
  }
};

export default {
  auth,
  campaigns,
  contacts,
  automation
};
