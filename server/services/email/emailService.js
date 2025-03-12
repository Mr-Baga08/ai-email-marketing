const nodemailer = require('nodemailer');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');

// Initialize Secret Manager
const secretClient = new SecretManagerServiceClient();

// Mapping of email providers to their SMTP settings
const providerSettings = {
  titan: {
    host: 'smtp.titan.email',
    port: 587,
    secure: false,
    requiresOAuth: false
  },
  gmail: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    requiresOAuth: true
  },
  outlook: {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    requiresOAuth: true
  },
  salesgrid: {
    // Custom provider would need specific settings
    host: 'smtp.salesgrid.com',
    port: 587,
    secure: false,
    requiresOAuth: false
  }
};

// Cache for transporters to avoid creating new ones for every email
const transporterCache = new Map();

/**
 * Get email credentials from Secret Manager
 * @param {string} provider - Email provider name
 */
async function getCredentials(provider) {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${provider}-credentials/versions/latest`,
    });
    
    return JSON.parse(version.payload.data.toString());
  } catch (error) {
    console.error(`Error accessing ${provider} credentials:`, error);
    // Fallback to env vars for development
    if (provider === 'titan') {
      return {
        user: process.env.TITAN_EMAIL_USER,
        pass: process.env.TITAN_EMAIL_PASS
      };
    }
    throw error;
  }
}

/**
 * Creates a transporter for a specific user
 * @param {Object} user - User object with email integration details
 */
async function createTransporter(user) {
  // Generate a cache key from the user's email and provider
  const cacheKey = `${user._id}:${user.emailIntegration.provider}`;
  
  // Check cache first
  if (transporterCache.has(cacheKey)) {
    return transporterCache.get(cacheKey);
  }
  
  const { provider, credentials } = user.emailIntegration;
  
  // Get provider settings
  const settings = providerSettings[provider];
  if (!settings) {
    throw new Error(`Unsupported email provider: ${provider}`);
  }
  
  let auth;
  
  if (settings.requiresOAuth) {
    // If the provider requires OAuth, set up OAuth2 client
    if (!credentials.refreshToken) {
      throw new Error('Missing refresh token for OAuth authentication');
    }
    
    // Get OAuth client credentials from Secret Manager
    const oauthCreds = await getCredentials(`${provider}-oauth`);
    
    const oauth2Client = new OAuth2Client(
      oauthCreds.clientId,
      oauthCreds.clientSecret,
      oauthCreds.redirectUri
    );
    
    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken
    });
    
    // Get a new access token if needed
    if (!credentials.accessToken || new Date(credentials.tokenExpiry) <= new Date()) {
      const { token } = await oauth2Client.getAccessToken();
      
      // Update the user's access token and expiry
      await User.findByIdAndUpdate(user._id, {
        'emailIntegration.credentials.accessToken': token,
        'emailIntegration.credentials.tokenExpiry': new Date(Date.now() + 3600000) // 1 hour
      });
      
      credentials.accessToken = token;
    }
    
    auth = {
      type: 'OAuth2',
      user: credentials.email,
      clientId: oauthCreds.clientId,
      clientSecret: oauthCreds.clientSecret,
      refreshToken: credentials.refreshToken,
      accessToken: credentials.accessToken
    };
  } else {
    // For basic auth providers like Titan
    const providerCreds = credentials.user && credentials.pass
      ? credentials
      : await getCredentials(provider);
    
    auth = {
      user: providerCreds.user || credentials.email,
      pass: providerCreds.pass
    };
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth
  });
  
  // Verify transporter
  await transporter.verify();
  
  // Cache transporter
  transporterCache.set(cacheKey, transporter);
  
  return transporter;
}

/**
 * Send an email
 * @param {Object} options - Email options
 */
exports.sendEmail = async (options) => {
  try {
    const { to, subject, text, html, from, user, campaignId } = options;
    
    // Get user if not provided
    let emailUser = user;
    if (!emailUser && options.userId) {
      emailUser = await User.findById(options.userId);
      if (!emailUser) {
        throw new Error('User not found');
      }
    }
    
    if (!emailUser) {
      throw new Error('User required to send email');
    }
    
    // Verify user has email integration
    if (!emailUser.emailIntegration || !emailUser.emailIntegration.verified) {
      throw new Error('User does not have verified email integration');
    }
    
    // Get transporter
    const transporter = await createTransporter(emailUser);
    
    // Create mail options
    const mailOptions = {
      from: from || {
        name: emailUser.name || 'Support Team',
        address: emailUser.emailIntegration.credentials.email
      },
      to,
      subject,
      headers: {}
    };
    
    // Add message ID and campaign ID if provided (for tracking)
    if (options.messageId) {
      mailOptions.headers['X-Message-ID'] = options.messageId;
    }
    
    if (campaignId) {
      mailOptions.headers['X-Campaign-ID'] = campaignId;
    }
    
    // Add content
    if (text) mailOptions.text = text;
    if (html) mailOptions.html = html;
    
    // Send mail
    const info = await transporter.sendMail(mailOptions);
    
    return {
      messageId: info.messageId,
      response: info.response,
      envelope: info.envelope
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a reply to an email
 * @param {Object} options - Reply options
 */
exports.sendReply = async (options) => {
  try {
    const { originalMessageId, to, subject, text, html, user } = options;
    
    // Extend the options with reply-specific headers
    const replyOptions = {
      ...options,
      headers: {
        'In-Reply-To': originalMessageId,
        'References': originalMessageId
      }
    };
    
    return await exports.sendEmail(replyOptions);
  } catch (error) {
    console.error('Error sending reply:', error);
    throw error;
  }
};