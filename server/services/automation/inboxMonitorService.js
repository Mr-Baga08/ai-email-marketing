const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const AutomatedEmail = require('../../models/AutomatedEmail');
const KnowledgeBase = require('../../models/KnowledgeBase');
const aiService = require('../ai/aiService');
const emailService = require('../email/emailService');
const { Readable } = require('stream');

// Initialize Secret Manager
const secretClient = new SecretManagerServiceClient();

// Store monitoring jobs by user ID
const monitoringJobs = new Map();

// Cache for knowledge base to avoid repeated DB queries
const knowledgeBaseCache = new Map();

/**
 * Start monitoring a user's inbox
 * @param {Object} user - User object
 * @param {number} interval - Check interval in minutes
 */
exports.monitorInbox = async (user, interval = 5) => {
  // Stop any existing monitoring job
  exports.stopMonitoring(user._id);
  
  // Check if user has email integration
  if (!user.emailIntegration || !user.emailIntegration.provider === 'none') {
    throw new Error('User does not have email integration set up');
  }
  
  console.log(`Starting email monitoring for user ${user._id} every ${interval} minutes`);
  
  // Create job object
  const job = {
    user: user._id,
    interval: interval * 60 * 1000, // Convert to milliseconds
    running: true
  };
  
  // Define check function
  const checkInbox = async () => {
    if (!job.running) return;
    
    try {
      console.log(`Checking inbox for user ${user._id}`);
      await processInbox(user);
    } catch (error) {
      console.error(`Error checking inbox for user ${user._id}:`, error);
    }
    
    // Schedule next check if still running
    if (job.running) {
      job.timeout = setTimeout(checkInbox, job.interval);
    }
  };
  
  // Start checking immediately
  checkInbox();
  
  // Store job
  monitoringJobs.set(user._id.toString(), job);
};

/**
 * Stop monitoring a user's inbox
 * @param {string} userId - User ID
 */
exports.stopMonitoring = (userId) => {
  const userIdStr = userId.toString();
  
  if (monitoringJobs.has(userIdStr)) {
    const job = monitoringJobs.get(userIdStr);
    
    // Clear timeout if exists
    if (job.timeout) {
      clearTimeout(job.timeout);
    }
    
    // Mark as not running
    job.running = false;
    
    // Remove from map
    monitoringJobs.delete(userIdStr);
    
    console.log(`Stopped email monitoring for user ${userId}`);
  }
};

/**
 * Process a user's inbox
 * @param {Object} user - User object
 */
async function processInbox(user) {
  return new Promise(async (resolve, reject) => {
    try {
      // Load knowledge base if not cached
      if (!knowledgeBaseCache.has(user._id.toString())) {
        await loadKnowledgeBase(user._id);
      }
      
      // Create IMAP client based on provider
      const imapConfig = await getImapConfig(user);
      
      const imap = new Imap(imapConfig);
      
      // Set up event handlers
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error('Error opening inbox:', err);
            imap.end();
            return reject(err);
          }
          
          // Search for unread messages
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              console.error('Error searching emails:', err);
              imap.end();
              return reject(err);
            }
            
            if (results.length === 0) {
              console.log(`No new emails found for user ${user._id}`);
              imap.end();
              return resolve([]);
            }
            
            console.log(`Found ${results.length} unread emails for user ${user._id}`);
            
            // Process each email
            const emails = [];
            const fetch = imap.fetch(results, { bodies: '', markSeen: true });
            
            fetch.on('message', (msg, seqno) => {
              const email = {};
              
              msg.on('body', (stream, info) => {
                simpleParser(stream, async (err, parsed) => {
                  if (err) {
                    console.error('Error parsing email:', err);
                    return;
                  }
                  
                  email.id = parsed.messageId;
                  email.subject = parsed.subject;
                  email.from = parsed.from.text;
                  email.to = parsed.to.text;
                  email.date = parsed.date;
                  email.body = parsed.text || parsed.html;
                  
                  emails.push(email);
                  
                  // Process this email with AI
                  try {
                    await processEmail(email, user);
                  } catch (processErr) {
                    console.error(`Error processing email ${email.id}:`, processErr);
                  }
                });
              });
            });
            
            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });
            
            fetch.once('end', () => {
              console.log(`Done fetching emails for user ${user._id}`);
              imap.end();
              resolve(emails);
            });
          });
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(err);
      });
      
      imap.once('end', () => {
        console.log('IMAP connection ended');
      });
      
      imap.connect();
    } catch (error) {
      console.error(`Error setting up IMAP for user ${user._id}:`, error);
      reject(error);
    }
  });
}

/**
 * Process an individual email with AI
 * @param {Object} email - Email object
 * @param {Object} user - User object
 */
async function processEmail(email, user) {
  try {
    console.log(`Processing email: ${email.subject}`);
    
    // Check if email is already processed
    const existing = await AutomatedEmail.findOne({ 
      messageId: email.id,
      user: user._id
    });
    
    if (existing) {
      console.log(`Email already processed: ${email.id}`);
      return;
    }
    
    // 1. Categorize email using AI
    const category = await aiService.categorizeEmail(email);
    console.log(`Categorized as: ${category}`);
    
    // 2. Generate response based on category
    let response;
    let needsHumanReview = false;
    
    if (category === 'product_inquiry') {
      // Use RAG for product inquiries
      const queries = await aiService.generateRAGQueries(email.body);
      const retrievedInfo = await retrieveFromKnowledgeBase(queries, user._id);
      response = await aiService.generateResponse(email, category, retrievedInfo);
    } else if (category === 'unrelated') {
      // Skip unrelated emails
      console.log('Skipping unrelated email');
      
      // Save to database as processed but not responded to
      await AutomatedEmail.create({
        user: user._id,
        messageId: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        receivedDate: email.date,
        category: category,
        responseGenerated: false,
        responseSent: false,
        needsHumanReview: false
      });
      
      return;
    } else {
      // Direct response for complaints and feedback
      response = await aiService.generateResponse(email, category);
    }
    
    // 3. Quality check the response
    const qualityCheck = await aiService.qualityCheckResponse(email.body, response);
    const isGood = qualityCheck.isGood;
    const feedback = qualityCheck.feedback;
    
    // 4. If not good, flag for human review
    if (!isGood) {
      needsHumanReview = true;
    }
    
    // 5. Send the response or create a draft based on quality
    let responseSent = false;
    
    if (!needsHumanReview) {
      try {
        await emailService.sendReply({
          originalMessageId: email.id,
          to: email.from,
          subject: `Re: ${email.subject}`,
          text: response,
          user
        });
        
        responseSent = true;
      } catch (error) {
        console.error('Error sending response:', error);
        needsHumanReview = true;
      }
    }
    
    // 6. Save to database
    await AutomatedEmail.create({
      user: user._id,
      messageId: email.id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      receivedDate: email.date,
      category: category,
      responseGenerated: true,
      responseSent: responseSent,
      responseText: response,
      responseDate: responseSent ? new Date() : undefined,
      needsHumanReview: needsHumanReview,
      metadata: {
        feedback: feedback
      }
    });
    
    console.log(`Email processing complete for: ${email.subject}`);
  } catch (error) {
    console.error('Error processing email:', error);
    
    // Log the error but continue processing other emails
    try {
      await AutomatedEmail.create({
        user: user._id,
        messageId: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        receivedDate: email.date,
        category: 'unrelated',
        responseGenerated: false,
        responseSent: false,
        needsHumanReview: true,
        metadata: {
          error: error.message
        }
      });
    } catch (logError) {
      console.error('Error logging failed email:', logError);
    }
  }
}

/**
 * Retrieve information from knowledge base using RAG
 * @param {Array} queries - Queries to search for
 * @param {string} userId - User ID
 */
async function retrieveFromKnowledgeBase(queries, userId) {
  try {
    let retrievedInfo = '';
    
    // Limit the number of queries to process
    const limitedQueries = queries.slice(0, 2);
    
    for (const query of limitedQueries) {
      // For each query, use vector search or keyword matching
      let relevantDocs = [];
      
      try {
        // Try to get embedding
        const embeddingResult = await aiService.getEmbedding(query);
        if (embeddingResult.success) {
          relevantDocs = findSimilarDocuments(embeddingResult.embedding, userId, 2);
        }
      } catch (error) {
        console.warn('Error getting embedding:', error);
      }
      
      // Fall back to keyword matching if vector search failed
      if (relevantDocs.length === 0) {
        relevantDocs = findDocumentsByKeywords(query, userId, 2);
      }
      
      // Use the relevant documents
      if (relevantDocs.length > 0) {
        retrievedInfo += `Information about: ${query}\n${relevantDocs.map(doc => doc.content).join('\n\n')}\n\n`;
      } else {
        retrievedInfo += `No specific information found for: ${query}\n\n`;
      }
    }
    
    return retrievedInfo.trim();
  } catch (error) {
    console.error('Error retrieving from knowledge base:', error);
    return '';
  }
}

/**
 * Load knowledge base for a user
 * @param {string} userId - User ID
 */
async function loadKnowledgeBase(userId) {
  try {
    // Load knowledge base chunks from database
    const documents = await KnowledgeBase.find({ user: userId }).sort({ createdAt: -1 });
    
    const knowledgeBase = documents.map(doc => ({
      id: doc._id,
      content: doc.content,
      embedding: doc.embedding,
      category: doc.category,
      metadata: doc.metadata
    }));
    
    // Cache knowledge base
    knowledgeBaseCache.set(userId.toString(), knowledgeBase);
    
    console.log(`Loaded ${knowledgeBase.length} knowledge base documents for user ${userId}`);
    
    return knowledgeBase;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return [];
  }
}

/**
 * Find documents by keywords
 * @param {string} query - Search query
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of results
 */
function findDocumentsByKeywords(query, userId, limit = 2) {
  // Get knowledge base for user
  const knowledgeBase = knowledgeBaseCache.get(userId.toString()) || [];
  
  // Skip if no documents
  if (knowledgeBase.length === 0) {
    return [];
  }
  
  // Extract keywords from query (simple approach)
  const keywords = query.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 3); // Only words with more than 3 chars
  
  // Score documents based on keyword matches
  const docsWithScore = knowledgeBase.map(doc => {
    const content = doc.content.toLowerCase();
    let score = 0;
    
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {
        score += 1;
      }
    });
    
    return { ...doc, score };
  });
  
  // Sort by score (highest first) and return top results
  return docsWithScore
    .filter(doc => doc.score > 0) // Only docs with matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find similar documents using vector embedding
 * @param {Array} queryEmbedding - Query embedding vector
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of results
 */
function findSimilarDocuments(queryEmbedding, userId, limit = 2) {
  // Get knowledge base for user
  const knowledgeBase = knowledgeBaseCache.get(userId.toString()) || [];
  
  // Skip computation if no documents or embedding
  if (knowledgeBase.length === 0 || !queryEmbedding || !queryEmbedding.length) {
    return [];
  }
  
  // Calculate cosine similarity for each document
 // Calculate cosine similarity for each document
const docsWithSimilarity = knowledgeBase
.filter(doc => doc.embedding && doc.embedding.length) // Only docs with embeddings
.map(doc => {
  const similarity = computeCosineSimilarity(queryEmbedding, doc.embedding);
  return { ...doc, similarity };
});

// Sort by similarity (highest first) and return top results
return docsWithSimilarity
.sort((a, b) => b.similarity - a.similarity)
.slice(0, limit);
}

/**
* Compute cosine similarity between two vectors
* @param {Array} vecA - First vector
* @param {Array} vecB - Second vector
*/
function computeCosineSimilarity(vecA, vecB) {
if (!vecA || !vecB || vecA.length !== vecB.length) {
  return 0;
}

let dotProduct = 0;
let normA = 0;
let normB = 0;

for (let i = 0; i < vecA.length; i++) {
  dotProduct += vecA[i] * vecB[i];
  normA += vecA[i] * vecA[i];
  normB += vecB[i] * vecB[i];
}

normA = Math.sqrt(normA);
normB = Math.sqrt(normB);

return normA && normB ? dotProduct / (normA * normB) : 0;
}

/**
* Get IMAP configuration for a user
* @param {Object} user - User object
*/
async function getImapConfig(user) {
const { provider, credentials } = user.emailIntegration;

// IMAP configurations for different providers
const imapConfigs = {
  titan: {
    user: credentials.email,
    password: credentials.password || await getProviderPassword('titan', user),
    host: 'imap.titan.email',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  },
  gmail: {
    user: credentials.email,
    xoauth2: await getOAuthToken('gmail', credentials),
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  },
  outlook: {
    user: credentials.email,
    xoauth2: await getOAuthToken('outlook', credentials),
    host: 'outlook.office365.com',
    port: 993,
    tls: true
  },
  // Add other providers as needed
};

if (!imapConfigs[provider]) {
  throw new Error(`Unsupported email provider for IMAP: ${provider}`);
}

return imapConfigs[provider];
}

/**
* Get password for email provider from Secret Manager
* @param {string} provider - Email provider
* @param {Object} user - User object
*/
async function getProviderPassword(provider, user) {
try {
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${process.env.GOOGLE_CLOUD_PROJECT}/secrets/${provider}-password-${user._id}/versions/latest`,
  });
  
  return version.payload.data.toString();
} catch (error) {
  console.error(`Error accessing ${provider} password:`, error);
  // Fallback to credentials in user object
  return user.emailIntegration.credentials.password;
}
}

/**
* Get OAuth token for email provider
* @param {string} provider - Email provider
* @param {Object} credentials - User credentials
*/
async function getOAuthToken(provider, credentials) {
try {
  // We would need to implement OAuth token generation here
  // This is a placeholder
  return credentials.accessToken;
} catch (error) {
  console.error('Error getting OAuth token:', error);
  throw error;
}
}