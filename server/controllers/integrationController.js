// server/controllers/integrationController.js
const User = require('../models/User');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { OAuth2Client } = require('google-auth-library');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const emailService = require('../services/email/emailService');

// Initialize Secret Manager
const secretClient = new SecretManagerServiceClient();

// Helper to get OAuth client credentials from Secret Manager
async function getOAuthCredentials(provider) {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${provider}-oauth-credentials/versions/latest`,
    });
    
    return JSON.parse(version.payload.data.toString());
  } catch (error) {
    console.error(`Error accessing ${provider} OAuth credentials:`, error);
    // Fallback to env vars for development
    return {
      clientId: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
      clientSecret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`],
      redirectUri: process.env[`${provider.toUpperCase()}_REDIRECT_URI`],
    };
  }
}

// @desc   Verify email credentials
// @route  POST /api/integrations/email/verify
// @access Private
exports.verifyEmailCredentials = async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    
    if (!provider || !credentials) {
      return res.status(400).json({ message: 'Provider and credentials are required' });
    }
    
    // Normalize credentials
    const email = credentials.email?.trim();
    const password = credentials.password;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // For providers that need password
    if (provider !== 'gmail' && provider !== 'outlook' && !password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Verify credentials
    let verified = false;
    
    if (provider === 'titan') {
      // Verify Titan email
      verified = await verifyTitanCredentials(email, password);
    } else if (provider === 'other') {
      // Verify custom SMTP/IMAP
      verified = await verifyCustomCredentials(
        email, 
        password, 
        credentials.server, 
        credentials.port
      );
    } else if (provider === 'gmail' || provider === 'outlook') {
      // For OAuth providers, this API is not the main verification point
      // Instead, we'll assume success and update the database
      verified = true;
    } else {
      return res.status(400).json({ message: 'Unsupported email provider' });
    }
    
    if (!verified) {
      return res.status(400).json({ message: 'Email verification failed. Please check your credentials.' });
    }
    
    // Store credentials securely in Secret Manager
    try {
      // Create secret name with user ID to maintain unique credentials per user
      const secretName = `${provider}-credentials-${req.user.id}`;
      
      // Check if secret already exists
      try {
        await secretClient.getSecret({
          name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${secretName}`
        });
        
        // Secret exists, update it
        await secretClient.addSecretVersion({
          parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${secretName}`,
          payload: {
            data: Buffer.from(JSON.stringify({
              email,
              password: provider !== 'gmail' && provider !== 'outlook' ? password : undefined,
              server: credentials.server,
              port: credentials.port
            }))
          }
        });
      } catch (error) {
        // Secret doesn't exist, create it
        await secretClient.createSecret({
          parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT}`,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {}
            }
          }
        });
        
        await secretClient.addSecretVersion({
          parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${secretName}`,
          payload: {
            data: Buffer.from(JSON.stringify({
              email,
              password: provider !== 'gmail' && provider !== 'outlook' ? password : undefined,
              server: credentials.server,
              port: credentials.port
            }))
          }
        });
      }
    } catch (secretError) {
      console.error('Error storing credentials in Secret Manager:', secretError);
      // Continue even if secret storage fails
    }
    
    // Update user's email integration information
    await User.findByIdAndUpdate(req.user.id, {
      emailIntegration: {
        provider,
        credentials: {
          email,
          // Don't store password in the database
          // For OAuth providers, store additional fields
          refreshToken: credentials.refreshToken,
          accessToken: credentials.accessToken,
          tokenExpiry: credentials.tokenExpiry
        },
        verified: true
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Email credentials verified successfully' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Get email integration status
// @route  GET /api/integrations/email/status
// @access Private
exports.getEmailIntegrationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('emailIntegration');
    
    if (!user.emailIntegration || user.emailIntegration.provider === 'none') {
      return res.json({
        status: 'not_connected',
        provider: null,
        email: null,
        verified: false
      });
    }
    
    res.json({
      status: user.emailIntegration.verified ? 'connected' : 'not_verified',
      provider: user.emailIntegration.provider,
      email: user.emailIntegration.credentials?.email,
      verified: user.emailIntegration.verified
    });
  } catch (error) {
    console.error('Get email integration status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Disconnect email integration
// @route  DELETE /api/integrations/email
// @access Private
exports.disconnectEmailIntegration = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'emailIntegration.verified': false,
      'emailIntegration.provider': 'none',
      'emailIntegration.credentials': {}
    });
    
    res.json({ 
      success: true, 
      message: 'Email integration disconnected successfully' 
    });
  } catch (error) {
    console.error('Disconnect email integration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Initiate OAuth flow for email providers
// @route  GET /api/integrations/oauth/:provider
// @access Private
exports.initiateOAuth = async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (provider !== 'gmail' && provider !== 'outlook') {
      return res.status(400).json({ message: 'Unsupported OAuth provider' });
    }
    
    // Get OAuth client credentials
    const credentials = await getOAuthCredentials(provider);
    
    if (!credentials || !credentials.clientId) {
      return res.status(500).json({ message: 'OAuth configuration is missing' });
    }
    
    // Create OAuth client
    const oauth2Client = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    
    // Define scopes based on provider
    let scopes = [];
    
    if (provider === 'gmail') {
      scopes = [
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email'
      ];
    } else if (provider === 'outlook') {
      scopes = [
        'offline_access',
        'https://outlook.office.com/IMAP.AccessAsUser.All',
        'https://outlook.office.com/SMTP.Send',
        'User.Read',
        'Mail.Read',
        'Mail.Send'
      ];
    }
    
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Always prompt for consent to ensure refresh token
    });
    
    // Store user ID in session or use state parameter
    // For this example, we'll use a state parameter with user ID
    // In production, use a secure state value and store mapping to user ID
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Initiate OAuth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Complete OAuth flow for email providers
// @route  POST /api/integrations/oauth/:provider/callback
// @access Private
exports.completeOAuth = async (req, res) => {
  try {
    const { provider } = req.params;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }
    
    if (provider !== 'gmail' && provider !== 'outlook') {
      return res.status(400).json({ message: 'Unsupported OAuth provider' });
    }
    
    // Get OAuth client credentials
    const credentials = await getOAuthCredentials(provider);
    
    if (!credentials || !credentials.clientId) {
      return res.status(500).json({ message: 'OAuth configuration is missing' });
    }
    
    // Create OAuth client
    const oauth2Client = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user email
    let userEmail = '';
    
    if (provider === 'gmail') {
      // For Gmail, get user info to retrieve email
      oauth2Client.setCredentials(tokens);
      const response = await oauth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json'
      });
      userEmail = response.data.email;
    } else if (provider === 'outlook') {
      // For Outlook, get user info to retrieve email
      oauth2Client.setCredentials(tokens);
      const response = await oauth2Client.request({
        url: 'https://graph.microsoft.com/v1.0/me'
      });
      userEmail = response.data.mail || response.data.userPrincipalName;
    }
    
    if (!userEmail) {
      return res.status(400).json({ message: 'Could not retrieve email from OAuth provider' });
    }
    
    // Update user with OAuth tokens
    await User.findByIdAndUpdate(req.user.id, {
      emailIntegration: {
        provider,
        credentials: {
          email: userEmail,
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          tokenExpiry: new Date(Date.now() + (tokens.expires_in * 1000))
        },
        verified: true
      }
    });
    
    res.json({ 
      success: true, 
      email: userEmail,
      message: 'OAuth authentication completed successfully' 
    });
  } catch (error) {
    console.error('Complete OAuth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc   Refresh OAuth token
// @route  POST /api/integrations/oauth/:provider/refresh
// @access Private
exports.refreshOAuthToken = async (req, res) => {
  try {
    const { provider } = req.params;
    
    if (provider !== 'gmail' && provider !== 'outlook') {
      return res.status(400).json({ message: 'Unsupported OAuth provider' });
    }
    
    // Get user with refresh token
    const user = await User.findById(req.user.id);
    
    if (!user.emailIntegration || 
        user.emailIntegration.provider !== provider || 
        !user.emailIntegration.credentials.refreshToken) {
      return res.status(400).json({ message: 'No valid refresh token found' });
    }
    
    // Get OAuth client credentials
    const credentials = await getOAuthCredentials(provider);
    
    // Create OAuth client
    const oauth2Client = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    
    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: user.emailIntegration.credentials.refreshToken
    });
    
    // Refresh token
    const { token } = await oauth2Client.getAccessToken();
    
    // Update user with new access token
    await User.findByIdAndUpdate(req.user.id, {
      'emailIntegration.credentials.accessToken': token,
      'emailIntegration.credentials.tokenExpiry': new Date(Date.now() + 3600000) // 1 hour
    });
    
    res.json({ 
      success: true, 
      message: 'OAuth token refreshed successfully' 
    });
  } catch (error) {
    console.error('Refresh OAuth token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper to verify Titan email credentials
async function verifyTitanCredentials(email, password) {
  try {
    // Check SMTP connection
    const transporter = nodemailer.createTransport({
      host: 'smtp.titan.email',
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password
      }
    });
    
    await transporter.verify();
    
    // Check IMAP connection
    await verifyImapConnection({
      user: email,
      password: password,
      host: 'imap.titan.email',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    return true;
  } catch (error) {
    console.error('Titan verification error:', error);
    return false;
  }
}

// Helper to verify custom email provider credentials
async function verifyCustomCredentials(email, password, server, port) {
  try {
    if (!server || !port) {
      return false;
    }
    
    // Try to extract IMAP settings from SMTP server
    const smtpDomain = server.replace(/^smtp\./, '');
    const potentialImapServer = `imap.${smtpDomain}`;
    
    // Check SMTP connection
    const transporter = nodemailer.createTransport({
      host: server,
      port: parseInt(port),
      secure: parseInt(port) === 465,
      auth: {
        user: email,
        pass: password
      }
    });
    
    await transporter.verify();
    
    // Try IMAP connection with potential IMAP server
    try {
      await verifyImapConnection({
        user: email,
        password: password,
        host: potentialImapServer,
        port: 993,
        tls: true
      });
    } catch (imapError) {
      console.warn('IMAP verification failed, but SMTP succeeded:', imapError);
      // Continue even if IMAP fails as long as SMTP works
    }
    
    return true;
  } catch (error) {
    console.error('Custom credentials verification error:', error);
    return false;
  }
}

// Helper to verify IMAP connection
async function verifyImapConnection(config) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);
    
    imap.once('ready', () => {
      imap.end();
      resolve(true);
    });
    
    imap.once('error', (err) => {
      reject(err);
    });
    
    imap.connect();
  });
}