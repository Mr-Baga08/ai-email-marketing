const Campaign = require('../models/Campaign');
const Contact = require('../models/Contact');
const ContactList = require('../models/ContactList');
const EmailLog = require('../models/EmailLog');
const emailService = require('../services/email/emailService');
const { Storage } = require('@google-cloud/storage');

const csv = require('csv-parser');
const xlsx = require('xlsx');

// Initialize Google Cloud Storage
const storage = new Storage();
// const contactsBucket = storage.bucket(process.env.CONTACT_UPLOADS_BUCKET);
const { contactsBucket, getPublicUrl } = require('../config/storage');

// @desc   Create a new campaign
// @route  POST /api/campaigns
// @access Private
exports.createCampaign = async (req, res) => {
  try {
    const { name, subject, content, senderName, contactListIds, schedule, type } = req.body;

    // Validate contact lists
    if (contactListIds && contactListIds.length > 0) {
      const lists = await ContactList.find({
        _id: { $in: contactListIds },
        user: req.user.id
      });

      if (lists.length !== contactListIds.length) {
        return res.status(400).json({ message: 'One or more contact lists not found' });
      }
    }

    // Create campaign
    const campaign = await Campaign.create({
      user: req.user.id,
      name,
      subject,
      content,
      senderName,
      senderEmail: req.user.emailIntegration.credentials?.email || req.user.email,
      contactLists: contactListIds || [],
      type: type || 'regular',
      schedule: schedule ? {
        scheduled: true,
        datetime: new Date(schedule.datetime),
        timezone: schedule.timezone || 'UTC'
      } : {
        scheduled: false
      },
      status: schedule?.scheduled ? 'scheduled' : 'draft',
      personalization: {
        fields: req.body.personalizationFields || [],
        aiEnhanced: req.body.aiEnhanced || false
      }
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get all campaigns
// @route  GET /api/campaigns
// @access Private
exports.getCampaigns = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('contactLists', 'name contactCount');
      
    // Get total count for pagination
    const total = await Campaign.countDocuments(filter);
    
    res.json({
      campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get campaign by ID
// @route  GET /api/campaigns/:id
// @access Private
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('contactLists', 'name contactCount');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Update campaign
// @route  PUT /api/campaigns/:id
// @access Private
exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Don't allow updates to campaigns that are already sending or completed
    if (['sending', 'completed'].includes(campaign.status)) {
      return res.status(400).json({ 
        message: 'Cannot update campaign that is already sending or completed' 
      });
    }
    
    const { 
      name, subject, content, senderName, 
      contactListIds, schedule, personalizationFields,
      aiEnhanced
    } = req.body;
    
    // Update fields
    if (name) campaign.name = name;
    if (subject) campaign.subject = subject;
    if (content) campaign.content = content;
    if (senderName) campaign.senderName = senderName;
    
    // Update contact lists if provided
    if (contactListIds) {
      // Validate contact lists
      const lists = await ContactList.find({
        _id: { $in: contactListIds },
        user: req.user.id
      });
      
      if (lists.length !== contactListIds.length) {
        return res.status(400).json({ message: 'One or more contact lists not found' });
      }
      
      campaign.contactLists = contactListIds;
    }
    
    // Update schedule if provided
    if (schedule) {
      campaign.schedule = {
        scheduled: schedule.scheduled,
        datetime: schedule.datetime ? new Date(schedule.datetime) : undefined,
        timezone: schedule.timezone || 'UTC'
      };
      
      // Update status based on schedule
      if (schedule.scheduled) {
        campaign.status = 'scheduled';
      } else {
        campaign.status = 'draft';
      }
    }
    
    // Update personalization
    if (personalizationFields || aiEnhanced !== undefined) {
      campaign.personalization = {
        ...campaign.personalization,
        fields: personalizationFields || campaign.personalization.fields,
        aiEnhanced: aiEnhanced !== undefined ? aiEnhanced : campaign.personalization.aiEnhanced
      };
    }
    
    const updatedCampaign = await campaign.save();
    
    res.json(updatedCampaign);
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Delete campaign
// @route  DELETE /api/campaigns/:id
// @access Private
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Don't allow deletion of campaigns that are sending
    if (campaign.status === 'sending') {
      return res.status(400).json({ message: 'Cannot delete a campaign that is currently sending' });
    }
    
    await campaign.remove();
    
    res.json({ message: 'Campaign removed' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Send campaign immediately
// @route  POST /api/campaigns/:id/send
// @access Private
exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('contactLists');
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Verify campaign can be sent
    if (['sending', 'completed'].includes(campaign.status)) {
      return res.status(400).json({ message: 'Campaign is already sending or completed' });
    }
    
    // Check if user has email integration set up
    if (!req.user.emailIntegration || !req.user.emailIntegration.verified) {
      return res.status(400).json({ message: 'Email integration not set up or verified' });
    }
    
    // Update campaign status
    campaign.status = 'sending';
    await campaign.save();
    
    // Start sending process in background
    processCampaign(campaign, req.user)
      .then(() => console.log(`Campaign ${campaign._id} sent successfully`))
      .catch(err => console.error(`Error sending campaign ${campaign._id}:`, err));
    
    res.json({ message: 'Campaign sending started', campaign });
  } catch (error) {
    console.error('Send campaign error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get campaign statistics
// @route  GET /api/campaigns/:id/stats
// @access Private
exports.getCampaignStats = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    // Get detailed email logs
    const emailLogs = await EmailLog.find({
      campaign: campaign._id
    }).select('status openCount clickCount lastOpened lastClicked recipientEmail');
    
    // Calculate additional statistics
    const openRate = campaign.stats.total > 0 
      ? (campaign.stats.opened / campaign.stats.total) * 100 
      : 0;
    
    const clickRate = campaign.stats.total > 0 
      ? (campaign.stats.clicked / campaign.stats.total) * 100 
      : 0;
    
    res.json({
      stats: campaign.stats,
      rates: {
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2))
      },
      emailLogs
    });
  } catch (error) {
    console.error('Get campaign stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper function to process campaign sending
async function processCampaign(campaign, user) {
  try {
    // Get all contacts from the campaign's contact lists
    const contactListIds = campaign.contactLists.map(list => list._id);
    
    const contacts = await Contact.find({
      lists: { $in: contactListIds },
      status: 'active',
      user: user._id
    });
    
    // Update campaign stats with total
    campaign.stats.total = contacts.length;
    await campaign.save();
    
    let sent = 0;
    let failed = 0;
    
    // Send emails to each contact
    for (const contact of contacts) {
      try {
        // Personalize email content
        const personalizedContent = personalizeEmail(
          campaign.content,
          contact,
          campaign.personalization
        );
        
        // Send email
        const result = await emailService.sendEmail({
          to: contact.email,
          subject: campaign.subject,
          html: personalizedContent,
          from: {
            name: campaign.senderName,
            email: user.emailIntegration.credentials.email
          },
          user: user._id,
          campaignId: campaign._id
        });
        
        // Log email
        await EmailLog.create({
          user: user._id,
          campaign: campaign._id,
          contact: contact._id,
          messageId: result.messageId,
          subject: campaign.subject,
          content: personalizedContent,
          recipientEmail: contact.email,
          status: 'sent',
          type: 'campaign',
          sentAt: new Date()
        });
        
        // Update contact
        contact.emailsSent += 1;
        contact.lastEmailSent = new Date();
        await contact.save();
        
        sent++;
      } catch (error) {
        console.error(`Error sending to ${contact.email}:`, error);
        
        // Log failed email
        await EmailLog.create({
          user: user._id,
          campaign: campaign._id,
          contact: contact._id,
          subject: campaign.subject,
          recipientEmail: contact.email,
          status: 'failed',
          type: 'campaign',
          failureReason: error.message,
          sentAt: new Date()
        });
        
        failed++;
      }
      
      // Update campaign stats periodically
      if (sent % 10 === 0 || failed % 10 === 0) {
        campaign.stats.sent = sent;
        campaign.stats.failed = failed;
        await campaign.save();
      }
    }
    
    // Update final campaign stats and status
    campaign.stats.sent = sent;
    campaign.stats.failed = failed;
    campaign.status = 'completed';
    await campaign.save();
    
    return { sent, failed };
  } catch (error) {
    console.error('Process campaign error:', error);
    
    // Update campaign status to failed
    campaign.status = 'failed';
    await campaign.save();
    
    throw error;
  }
}

// Helper function to personalize email
function personalizeEmail(content, contact, personalization) {
  let personalizedContent = content;
  
  // Replace basic fields
  const replacements = {
    '{firstName}': contact.firstName || '',
    '{lastName}': contact.lastName || '',
    '{email}': contact.email || '',
    '{company}': contact.company || '',
    '{position}': contact.position || ''
  };
  
  // Replace all basic fields
  Object.entries(replacements).forEach(([key, value]) => {
    personalizedContent = personalizedContent.replace(new RegExp(key, 'g'), value);
  });
  
  // Replace custom fields
  if (contact.customFields && personalization.fields) {
    personalization.fields.forEach(field => {
      const placeholder = `{${field}}`;
      const value = contact.customFields.get(field) || '';
      personalizedContent = personalizedContent.replace(new RegExp(placeholder, 'g'), value);
    });
  }
  
  return personalizedContent;
}