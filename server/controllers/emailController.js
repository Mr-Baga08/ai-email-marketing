const EmailTemplate = require('../models/EmailTemplate');
const EmailSettings = require('../models/EmailSettings');
const EmailEvent = require('../models/EmailEvent');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Transporter cache to avoid creating transporter for every email
const transporterCache = new Map();

// Email providers configuration
const emailProviders = [
  {
    id: 'titan',
    name: 'Titan Email',
    description: 'Professional email built for businesses',
    authType: 'plain',
    settings: {
      server: 'smtp.titan.email',
      port: 587,
      secure: false
    }
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Google Workspace or Gmail account',
    authType: 'oauth2',
    settings: {
      server: 'smtp.gmail.com',
      port: 465,
      secure: true
    }
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Microsoft 365 or Outlook.com',
    authType: 'oauth2',
    settings: {
      server: 'smtp.office365.com',
      port: 587,
      secure: false
    }
  },
  {
    id: 'custom',
    name: 'Other Provider',
    description: 'Custom SMTP configuration',
    authType: 'plain'
  }
];

// @desc   Get email settings
// @route  GET /api/emails/settings
// @access Private
exports.getEmailSettings = async (req, res) => {
  try {
    let settings = await EmailSettings.findOne({ user: req.user.id });
    
    // If no settings found, create default settings
    if (!settings) {
      settings = await EmailSettings.create({
        user: req.user.id,
        provider: 'none',
        default: {
          senderName: req.user.name || 'Support Team'
        }
      });
    }
    
    // Don't send sensitive data back to client
    const safeSettings = {
      ...settings.toObject(),
      credentials: {
        email: settings.credentials?.email,
        server: settings.credentials?.server,
        port: settings.credentials?.port,
        secure: settings.credentials?.secure,
        authType: settings.credentials?.authType
      }
    };
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Get email settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update email settings
// @route  PUT /api/emails/settings
// @access Private
exports.updateEmailSettings = async (req, res) => {
  try {
    const { provider, credentials, default: defaultSettings, tracking } = req.body;
    
    let settings = await EmailSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      settings = new EmailSettings({
        user: req.user.id,
        provider: 'none'
      });
    }
    
    // Update fields if provided
    if (provider) settings.provider = provider;
    
    if (credentials) {
      // Only update specific credential fields that were provided
      settings.credentials = {
        ...settings.credentials,
        ...credentials
      };
    }
    
    if (defaultSettings) {
      settings.default = {
        ...settings.default,
        ...defaultSettings
      };
    }
    
    if (tracking) {
      settings.tracking = {
        ...settings.tracking,
        ...tracking
      };
    }
    
    await settings.save();
    
    // Don't send sensitive data back to client
    const safeSettings = {
      ...settings.toObject(),
      credentials: {
        email: settings.credentials?.email,
        server: settings.credentials?.server,
        port: settings.credentials?.port,
        secure: settings.credentials?.secure,
        authType: settings.credentials?.authType
      }
    };
    
    res.json(safeSettings);
  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Verify email settings
// @route  POST /api/emails/verify-settings
// @access Private
exports.verifyEmailSettings = async (req, res) => {
  try {
    const settings = await EmailSettings.findOne({ user: req.user.id });
    
    if (!settings) {
      return res.status(400).json({ message: 'Email settings not found' });
    }
    
    if (settings.provider === 'none') {
      return res.status(400).json({ message: 'No email provider configured' });
    }
    
    // Create transporter to test connection
    let transporter;
    try {
      transporter = await createTransporter(settings);
    } catch (error) {
      return res.status(400).json({ 
        message: 'Failed to create email connection', 
        error: error.message 
      });
    }
    
    // Verify the connection
    try {
      await transporter.verify();
      
      // Update settings as verified
      settings.verified = true;
      await settings.save();
      
      res.json({ 
        success: true, 
        message: 'Email settings verified successfully' 
      });
    } catch (error) {
      return res.status(400).json({ 
        message: 'Email verification failed', 
        error: error.message
      });
    }
  } catch (error) {
    console.error('Verify email settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get available email providers
// @route  GET /api/emails/providers
// @access Private
exports.getEmailProviders = async (req, res) => {
  try {
    res.json(emailProviders);
  } catch (error) {
    console.error('Get email providers error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get all email templates
// @route  GET /api/emails/templates
// @access Private
exports.getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get email template by ID
// @route  GET /api/emails/templates/:id
// @access Private
exports.getEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Create email template
// @route  POST /api/emails/templates
// @access Private
exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, content, category, tags, isDefault, aiGenerated } = req.body;
    
    if (!name || !subject || !content) {
      return res.status(400).json({ message: 'Name, subject, and content are required' });
    }
    
    // If setting as default, unset any existing defaults
    if (isDefault) {
      await EmailTemplate.updateMany(
        { user: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const template = await EmailTemplate.create({
      user: req.user.id,
      name,
      subject,
      content,
      category: category || 'general',
      tags: tags || [],
      isDefault: isDefault || false,
      aiGenerated: aiGenerated || false
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update email template
// @route  PUT /api/emails/templates/:id
// @access Private
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { name, subject, content, category, tags, isDefault } = req.body;
    
    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    // If setting as default, unset any existing defaults
    if (isDefault && !template.isDefault) {
      await EmailTemplate.updateMany(
        { user: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    // Update fields
    if (name) template.name = name;
    if (subject) template.subject = subject;
    if (content) template.content = content;
    if (category) template.category = category;
    if (tags) template.tags = tags;
    if (isDefault !== undefined) template.isDefault = isDefault;
    
    await template.save();
    
    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Delete email template
// @route  DELETE /api/emails/templates/:id
// @access Private
exports.deleteEmailTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    await template.deleteOne();
    
    res.json({ message: 'Template removed' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Send a test email
// @route  POST /api/emails/test
// @access Private
exports.sendTestEmail = async (req, res) => {
  try {
    const { to, subject, content, templateId, fromName } = req.body;
    
    if (!to) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }
    
    // Get email settings
    const settings = await EmailSettings.findOne({ user: req.user.id });
    
    if (!settings || !settings.verified) {
      return res.status(400).json({ message: 'Email settings not configured or verified' });
    }
    
    let emailContent = content;
    let emailSubject = subject;
    
    // If templateId is provided, use that template
    if (templateId && !content) {
      const template = await EmailTemplate.findOne({
        _id: templateId,
        user: req.user.id
      });
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      emailContent = template.content;
      emailSubject = subject || template.subject;
    }
    
    if (!emailContent) {
      return res.status(400).json({ message: 'Email content is required' });
    }
    
    if (!emailSubject) {
      return res.status(400).json({ message: 'Email subject is required' });
    }
    
    // Create transporter
    const transporter = await createTransporter(settings);
    
    // Generate a tracking ID
    const trackingId = crypto.randomBytes(16).toString('hex');
    
    // Add tracking pixel if tracking is enabled
    let htmlContent = emailContent;
    if (settings.tracking?.trackOpens) {
      const trackingPixel = `<img src="${getTrackingUrl(req, 'open', trackingId)}" alt="" width="1" height="1" border="0" style="height:1px!important;width:1px!important;border-width:0!important;margin:0!important;padding:0!important" />`;
      htmlContent += trackingPixel;
    }
    
    // Replace tracking links if click tracking is enabled
    if (settings.tracking?.trackClicks) {
      htmlContent = replaceLinks(htmlContent, req, trackingId);
    }
    
    // Generate a unique message ID
    const messageId = `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@${req.get('host') || 'emailmarketingtool.com'}>`;
    
    // Send the email
    const mailOptions = {
      from: {
        name: fromName || settings.default?.senderName || req.user.name,
        address: settings.credentials.email
      },
      to: to,
      subject: emailSubject,
      html: htmlContent,
      text: stripHtml(emailContent),
      headers: {
        'X-Message-ID': messageId,
        'X-Tracking-ID': trackingId
      }
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log the email send event
    await EmailEvent.create({
      user: req.user.id,
      messageId,
      trackingId,
      recipient: {
        email: to
      },
      eventType: 'send',
      data: {
        status: 'sent'
      },
      metadata: {
        isTest: true,
        smtpResponse: info.response
      }
    });
    
    res.json({
      success: true,
      messageId,
      info: {
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response
      }
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
};

// @desc   Send bulk emails
// @route  POST /api/emails/send-bulk
// @access Private
exports.sendBulkEmails = async (req, res) => {
  try {
    const { 
      campaignId, 
      templateId, 
      subject, 
      content, 
      contactIds, 
      contactListIds, 
      fromName,
      scheduleDate 
    } = req.body;
    
    // Validate the request
    if ((!templateId && !content) || !subject) {
      return res.status(400).json({ message: 'Email content and subject are required' });
    }
    
    if (!contactIds?.length && !contactListIds?.length) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }
    
    // Get email settings
    const settings = await EmailSettings.findOne({ user: req.user.id });
    
    if (!settings || !settings.verified) {
      return res.status(400).json({ message: 'Email settings not configured or verified' });
    }
    
    // Get the campaign if provided
    let campaign;
    if (campaignId) {
      campaign = await Campaign.findOne({
        _id: campaignId,
        user: req.user.id
      });
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
    }
    
    // Get the email content
    let emailContent = content;
    let emailSubject = subject;
    
    // If templateId is provided, load the template
    if (templateId) {
      const template = await EmailTemplate.findOne({
        _id: templateId,
        user: req.user.id
      });
      
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }
      
      emailContent = content || template.content;
      emailSubject = subject || template.subject;
    }
    
    // Get the recipients
    let contacts = [];
    
    // Add contacts by IDs
    if (contactIds && contactIds.length > 0) {
      const contactsById = await Contact.find({
        _id: { $in: contactIds },
        user: req.user.id,
        status: 'active'
      });
      
      contacts = contacts.concat(contactsById);
    }
    
    // Add contacts from lists
    if (contactListIds && contactListIds.length > 0) {
      const contactsFromLists = await Contact.find({
        lists: { $in: contactListIds },
        user: req.user.id,
        status: 'active'
      });
      
      // Merge and remove duplicates by email
      const existingEmails = new Set(contacts.map(c => c.email.toLowerCase()));
      contactsFromLists.forEach(contact => {
        if (!existingEmails.has(contact.email.toLowerCase())) {
          contacts.push(contact);
          existingEmails.add(contact.email.toLowerCase());
        }
      });
    }
    
    if (contacts.length === 0) {
      return res.status(400).json({ message: 'No valid contacts found' });
    }
    
    // If we need to schedule this for later
    if (scheduleDate) {
      const scheduledTime = new Date(scheduleDate);
      
      if (isNaN(scheduledTime.getTime()) || scheduledTime <= new Date()) {
        return res.status(400).json({ message: 'Invalid schedule time' });
      }
      
      // Create or update campaign with schedule
      if (campaign) {
        campaign.schedule = {
          scheduled: true,
          datetime: scheduledTime
        };
        campaign.status = 'scheduled';
        await campaign.save();
      } else {
        // Create a new campaign for this scheduled send
        campaign = await Campaign.create({
          user: req.user.id,
          name: `Campaign ${new Date().toISOString().split('T')[0]}`,
          subject: emailSubject,
          content: emailContent,
          senderName: fromName || settings.default?.senderName || req.user.name,
          senderEmail: settings.credentials.email,
          status: 'scheduled',
          contactLists: contactListIds || [],
          schedule: {
            scheduled: true,
            datetime: scheduledTime
          }
        });
      }
      
      return res.json({
        success: true,
        scheduled: true,
        scheduledTime,
        campaign: campaign._id,
        recipients: contacts.length
      });
    }
    
    // Start sending emails immediately
    // Create transporter
    const transporter = await createTransporter(settings);
    
    // Prepare the results
    const results = {
      total: contacts.length,
      successful: 0,
      failed: 0,
      messageIds: []
    };
    
    // Create or update campaign as sending
    if (!campaign) {
      campaign = await Campaign.create({
        user: req.user.id,
        name: `Campaign ${new Date().toISOString().split('T')[0]}`,
        subject: emailSubject,
        content: emailContent,
        senderName: fromName || settings.default?.senderName || req.user.name,
        senderEmail: settings.credentials.email,
        status: 'sending',
        contactLists: contactListIds || []
      });
    } else {
      campaign.status = 'sending';
      campaign.subject = emailSubject;
      campaign.content = emailContent;
      await campaign.save();
    }
    
    // Process in background to not block the response
    processBulkEmails(
      transporter, 
      contacts, 
      campaign, 
      emailSubject, 
      emailContent, 
      settings, 
      req.user.id, 
      req
    )
      .then(result => {
        console.log(`Bulk email sending completed: ${result.successful}/${result.total} sent`);
      })
      .catch(err => {
        console.error('Error sending bulk emails:', err);
      });
    
    // Return immediate response with campaign ID
    res.json({
      success: true,
      campaign: campaign._id,
      message: 'Bulk email sending started',
      recipients: contacts.length
    });
  } catch (error) {
    console.error('Send bulk email error:', error);
    res.status(500).json({ message: 'Failed to send bulk emails', error: error.message });
  }
};

// @desc   Get email tracking data
// @route  GET /api/emails/tracking
// @access Private
exports.getEmailTrackingData = async (req, res) => {
  try {
    const { campaignId, startDate, endDate, eventType, limit = 50, page = 1 } = req.query;
    
    // Build query
    const query = { user: req.user.id };
    
    if (campaignId) {
      query.campaign = campaignId;
    }
    
    if (eventType) {
      query.eventType = eventType;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get events with pagination
    const events = await EmailEvent.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('campaign', 'name subject');
    
    // Get total count
    const total = await EmailEvent.countDocuments(query);
    
    // Get event counts by type
    const eventCounts = await EmailEvent.aggregate([
      { $match: query },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);
    
    // Format event counts
    const countsByType = {};
    eventCounts.forEach(item => {
      countsByType[item._id] = item.count;
    });
    
    res.json({
      events,
      countsByType,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get email tracking data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get events by message ID
// @route  GET /api/emails/tracking/:messageId
// @access Private
exports.getEmailEventsByMessageId = async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const events = await EmailEvent.find({
      user: req.user.id,
      messageId
    }).sort({ timestamp: 1 });
    
    if (events.length === 0) {
      return res.status(404).json({ message: 'No events found for this message ID' });
    }
    
    res.json(events);
  } catch (error) {
    console.error('Get email events error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Track email open
// @route  GET /api/emails/track/open/:trackingId
// @access Public
exports.trackEmailOpen = async (req, res) => {
  try {
    const { trackingId } = req.params;
    
    // Send 1x1 transparent pixel
    res.set('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    
    // Find the original send event for this tracking ID
    const sendEvent = await EmailEvent.findOne({
      trackingId,
      eventType: 'send'
    });
    
    if (!sendEvent) {
      console.warn(`Open event for unknown tracking ID: ${trackingId}`);
      return;
    }
    
    // Record the open event
    await EmailEvent.create({
      user: sendEvent.user,
      campaign: sendEvent.campaign,
      messageId: sendEvent.messageId,
      trackingId,
      recipient: sendEvent.recipient,
      eventType: 'open',
      data: {
        userAgent: req.get('User-Agent'),
        ipAddress: getClientIp(req)
      }
    });
    
  } catch (error) {
    console.error('Track email open error:', error);
    // Still return the pixel even if there's an error
    res.set('Content-Type', 'image/gif');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  }
};

// @desc   Track email click
// @route  GET /api/emails/track/click/:trackingId
// @access Public
exports.trackEmailClick = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }
    
    // Find the original send event for this tracking ID
    const sendEvent = await EmailEvent.findOne({
      trackingId,
      eventType: 'send'
    });
    
    if (!sendEvent) {
      console.warn(`Click event for unknown tracking ID: ${trackingId}`);
      // Still redirect the user
      return res.redirect(url);
    }
    
    // Record the click event
    await EmailEvent.create({
      user: sendEvent.user,
      campaign: sendEvent.campaign,
      messageId: sendEvent.messageId,
      trackingId,
      recipient: sendEvent.recipient,
      eventType: 'click',
      data: {
        url,
        userAgent: req.get('User-Agent'),
        ipAddress: getClientIp(req)
      }
    });
    
    // Redirect the user to the actual URL
    res.redirect(url);
    
  } catch (error) {
    console.error('Track email click error:', error);
    
    // Redirect to the URL anyway, even if there's an error
    if (req.query.url) {
      res.redirect(req.query.url);
    } else {
      res.status(500).send('An error occurred while tracking');
    }
  }
};

// Helper function to create email transporter
async function createTransporter(settings) {
  // Generate a cache key
  const cacheKey = `${settings.user}_${settings.provider}`;
  
  // Check cache first
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey);
  }
  
  // Get provider settings
  const provider = emailProviders.find(p => p.id === settings.provider);
  
  if (!provider) {
    throw new Error(`Unsupported email provider: ${settings.provider}`);
  }
  
  let auth;
  let transporterConfig;
  
  if (provider.authType === 'oauth2') {
    // OAuth2 authentication
    if (!settings.credentials?.refreshToken) {
      throw new Error('Missing refresh token for OAuth authentication');
    }
    
    // For OAuth providers like Gmail and Outlook
    // In a real app, you'd get these from Secret Manager in GCP
    const oauthClientId = process.env.OAUTH_CLIENT_ID || 'your-oauth-client-id';
    const oauthClientSecret = process.env.OAUTH_CLIENT_SECRET || 'your-oauth-client-secret';
    
    const oauth2Client = new OAuth2Client(
      oauthClientId,
      oauthClientSecret,
      'https://developers.google.com/oauthplayground' // This should be your actual redirect URI
    );
    
    oauth2Client.setCredentials({
      refresh_token: settings.credentials.refreshToken
    });
    
    // Get a new access token if needed
    if (!settings.credentials.accessToken || new Date(settings.credentials.tokenExpiry) <= new Date()) {
      try {
        const { token } = await oauth2Client.getAccessToken();
        
        // Update the access token in settings
        settings.credentials.accessToken = token;
        settings.credentials.tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await settings.save();
      } catch (error) {
        console.error('Error refreshing access token:', error);
        throw new Error('Failed to refresh OAuth access token');
      }
    }
    
    auth = {
      type: 'OAuth2',
      user: settings.credentials.email,
      clientId: oauthClientId,
      clientSecret: oauthClientSecret,
      refreshToken: settings.credentials.refreshToken,
      accessToken: settings.credentials.accessToken
    };
    
    transporterConfig = {
      host: provider.settings.server,
      port: provider.settings.port,
      secure: provider.settings.secure,
      auth
    };
  } else {
    // Regular username/password authentication
    auth = {
      user: settings.credentials.email,
      pass: settings.credentials.password
    };
    
    if (settings.provider === 'custom') {
      transporterConfig = {
        host: settings.credentials.server,
        port: settings.credentials.port,
        secure: settings.credentials.secure || false,
        auth
      };
    } else {
      transporterConfig = {
        host: provider.settings.server,
        port: provider.settings.port,
        secure: provider.settings.secure,
        auth
      };
    }
  }
  
  // Create the transporter
  const transporter = nodemailer.createTransport(transporterConfig);
  
  // Cache the transporter
  transporterCache.set(cacheKey, transporter);
  
  return transporter;
}

// Helper function to process bulk emails
async function processBulkEmails(transporter, contacts, campaign, subject, content, settings, userId, req) {
  let successful = 0;
  let failed = 0;
  
  try {
    // Update campaign stats with total
    campaign.stats = {
      ...campaign.stats,
      total: contacts.length
    };
    await campaign.save();
    
    // Send to each contact
    for (const contact of contacts) {
      try {
        // Generate tracking ID
        const trackingId = crypto.randomBytes(16).toString('hex');
        
        // Generate message ID
        const messageId = `<${Date.now()}.${crypto.randomBytes(8).toString('hex')}@${req.get('host') || 'emailmarketingtool.com'}>`;
        
        // Personalize the content
        let personalizedContent = personalizeContent(content, contact);
        let personalizedSubject = personalizeContent(subject, contact);
        
        // Add tracking pixel if enabled
        if (settings.tracking?.trackOpens) {
          const trackingPixel = `<img src="${getTrackingUrl(req, 'open', trackingId)}" alt="" width="1" height="1" border="0" style="height:1px!important;width:1px!important;border-width:0!important;margin:0!important;padding:0!important" />`;
          personalizedContent += trackingPixel;
        }
        
        // Add link tracking if enabled
        if (settings.tracking?.trackClicks) {
          personalizedContent = replaceLinks(personalizedContent, req, trackingId);
        }
        
        // Send the email
        const mailOptions = {
          from: {
            name: campaign.senderName || settings.default?.senderName,
            address: settings.credentials.email
          },
          to: contact.email,
          subject: personalizedSubject,
          html: personalizedContent,
          text: stripHtml(personalizedContent),
          headers: {
            'X-Message-ID': messageId,
            'X-Tracking-ID': trackingId,
            'X-Campaign-ID': campaign._id.toString()
          }
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        // Log the send event
        await EmailEvent.create({
          user: userId,
          campaign: campaign._id,
          messageId,
          trackingId,
          recipient: {
            email: contact.email,
            name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
          },
          eventType: 'send',
          data: {
            status: 'sent'
          },
          metadata: {
            smtpResponse: info.response
          }
        });
        
        // Update contact
        contact.emailsSent = (contact.emailsSent || 0) + 1;
        contact.lastEmailSent = new Date();
        await contact.save();
        
        successful++;
        
        // Update campaign stats periodically
        if (successful % 10 === 0 || failed % 10 === 0) {
          campaign.stats.sent = successful;
          campaign.stats.failed = failed;
          await campaign.save();
        }
        
        // Respect rate limits
        if (settings.limits?.emailsPerHour) {
          await new Promise(resolve => setTimeout(resolve, 3600000 / settings.limits.emailsPerHour));
        } else {
          // Default pause to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.error(`Error sending to ${contact.email}:`, error);
        
        // Log the failure
        await EmailEvent.create({
          user: userId,
          campaign: campaign._id,
          recipient: {
            email: contact.email,
            name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
          },
          eventType: 'send',
          data: {
            status: 'failed'
          },
          metadata: {
            error: error.message
          }
        });
        
        failed++;
        
        // Update campaign stats periodically
        if (successful % 10 === 0 || failed % 10 === 0) {
          campaign.stats.sent = successful;
          campaign.stats.failed = failed;
          await campaign.save();
        }
      }
    }
    
    // Update final campaign stats
    campaign.stats.sent = successful;
    campaign.stats.failed = failed;
    campaign.status = 'completed';
    await campaign.save();
    
    return { successful, failed, total: contacts.length };
  } catch (error) {
    console.error('Bulk email processing error:', error);
    
    // Update campaign as failed
    campaign.status = 'failed';
    await campaign.save();
    
    throw error;
  }
}

// Helper function to personalize content with contact data
function personalizeContent(content, contact) {
  if (!content) return '';
  
  let result = content;
  
  // Replace standard fields
  const replacements = {
    '{firstName}': contact.firstName || '',
    '{lastName}': contact.lastName || '',
    '{email}': contact.email || '',
    '{company}': contact.company || '',
    '{position}': contact.position || '',
    '{phone}': contact.phone || ''
  };
  
  // Replace all standard fields
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });
  
  // Replace custom fields if they exist
  if (contact.customFields && contact.customFields.size > 0) {
    contact.customFields.forEach((value, key) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    });
  }
  
  return result;
}

// Helper function to get tracking URL
function getTrackingUrl(req, type, trackingId) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/api/emails/track/${type}/${trackingId}`;
}

// Helper function to replace links for click tracking
function replaceLinks(html, req, trackingId) {
  // Simple regex for href attributes
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
  
  return html.replace(linkRegex, (match, url) => {
    const trackingUrl = `${getTrackingUrl(req, 'click', trackingId)}?url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
}

// Helper function to strip HTML for plain text version
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to get client IP address
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket.remoteAddress;
}