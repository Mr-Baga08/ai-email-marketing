// server/config/config.js
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Default configuration values
const defaultConfig = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // MongoDB Configuration
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/email-marketing',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  
  // Google Cloud Configuration
  gcp: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GCP_LOCATION || 'us-central1',
    aiPlatform: {
      modelName: process.env.VERTEX_AI_MODEL || 'gemini-pro',
      embeddingModel: process.env.VERTEX_AI_EMBEDDING_MODEL || 'textembedding-gecko@003',
    },
    storage: {
      contactUploadsBucket: process.env.CONTACT_UPLOADS_BUCKET || `${process.env.GOOGLE_CLOUD_PROJECT}-contact-uploads`
    }
  },
  
  // CORS Configuration
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  
  // Email Providers Configuration
  emailProviders: {
    titan: {
      host: 'smtp.titan.email',
      port: 587,
      secure: false,
      imap: {
        host: 'imap.titan.email',
        port: 993,
        secure: true
      }
    },
    gmail: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      imap: {
        host: 'imap.gmail.com',
        port: 993,
        secure: true
      },
      oauth: {
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/gmail/callback'
      }
    },
    outlook: {
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      imap: {
        host: 'outlook.office365.com',
        port: 993,
        secure: true
      },
      oauth: {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        redirectUri: process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/outlook/callback',
        authority: 'https://login.microsoftonline.com/common'
      }
    }
  },
  
  // Fallback LLM Configuration for CPU-only environments
  localLLM: {
    apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434/api',
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'llama2',
    contextSize: parseInt(process.env.LLM_CONTEXT_SIZE) || 2048,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 1024
  },
  
  // Subscription Plans Configuration
  subscriptionPlans: {
    free: {
      name: 'Free',
      priceMonthly: 0,
      features: ['basic_email_campaigns', 'contact_management', 'template_editor'],
      limits: {
        contacts: 500,
        emailsPerMonth: 2000
      }
    },
    basic: {
      name: 'Basic',
      priceMonthly: 29,
      features: ['basic_email_campaigns', 'contact_management', 'template_editor', 'basic_reporting', 'email_support'],
      limits: {
        contacts: 1000,
        emailsPerMonth: 10000
      }
    },
    premium: {
      name: 'Premium',
      priceMonthly: 79,
      features: ['advanced_email_campaigns', 'contact_management', 'template_editor', 'advanced_segmentation', 'a_b_testing', 'advanced_analytics', 'priority_support'],
      limits: {
        contacts: 10000,
        emailsPerMonth: 50000
      }
    },
    enterprise: {
      name: 'Enterprise',
      priceMonthly: 249,
      features: ['enterprise_email_campaigns', 'contact_management', 'template_editor', 'advanced_segmentation', 'a_b_testing', 'advanced_analytics', 'dedicated_support', 'custom_integrations', 'advanced_security'],
      limits: {
        contacts: null, // unlimited
        emailsPerMonth: null // unlimited
      }
    }
  },
  
  // AI Email Automation Add-on Configuration
  aiEmailAutomation: {
    priceMonthly: 1000,
    features: ['inbox_monitoring', 'email_classification', 'ai_responses', 'knowledge_base', 'human_review'],
    limits: {
      emailsPerDay: 1000
    }
  },
  
  // Rate Limiting Configuration
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    emailSending: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 500 // limit email sending to 500 per hour
    },
    aiCalls: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 100 // limit AI service calls to 100 per hour
    }
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

// Environment-specific overrides
const envConfig = {
  development: {
    // Development-specific settings
    logging: {
      level: 'debug',
      format: 'pretty'
    }
  },
  test: {
    // Test-specific settings
    mongoURI: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/email-marketing-test',
    logging: {
      level: 'error'
    }
  },
  production: {
    // Production-specific settings
    // In production, rely on environment variables set in App Engine
    jwtSecret: process.env.JWT_SECRET, // Must be set in environment
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://' + process.env.GOOGLE_CLOUD_PROJECT + '.uc.r.appspot.com'],
    rateLimits: {
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 200 // increase limit for production
      }
    }
  }
};

// Merge default config with environment-specific overrides
const config = {
  ...defaultConfig,
  ...(envConfig[process.env.NODE_ENV] || {}),
};

// Helper function to check if running on GCP
config.isRunningOnGCP = () => {
  return process.env.GOOGLE_CLOUD_PROJECT && process.env.K_SERVICE ? true : false;
};

// Helper function to check if AI email automation is enabled
config.isAIAutomationEnabled = () => {
  return config.isRunningOnGCP() || (process.env.ENABLE_AI_AUTOMATION === 'true');
};

module.exports = config;