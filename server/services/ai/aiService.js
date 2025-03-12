// server/services/ai/aiService.js

const { VertexAI } = require('@google-cloud/vertexai');
const axios = require('axios');
const rlhfService = require('./rlhfService');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');

// Initialize the Vertex AI client
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1'
});

// Get the Gemini model for general tasks
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: process.env.VERTEX_AI_MODEL || 'gemini-pro',
  generation_config: {
    max_output_tokens: 1024,
    temperature: 0.2
  }
});

// Marketing-specific model with higher creativity for campaigns
const marketingModel = vertexAI.preview.getGenerativeModel({
  model: process.env.VERTEX_AI_MODEL || 'gemini-pro',
  generation_config: {
    max_output_tokens: 2048,
    temperature: 0.7
  }
});

// Fallback to local Ollama or open-source models if needed
const OLLAMA_API = process.env.OLLAMA_API_URL || 'http://localhost:11434/api';
const DEFAULT_MODEL = process.env.DEFAULT_LLM_MODEL || 'llama2';

// Define schema for generated email templates if not already defined
const emailTemplateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  industry: String,
  purpose: String,
  tone: String,
  length: String,
  target: String,
  customInstructions: String,
  basePrompt: String,
  usageCount: {
    type: Number,
    default: 0
  },
  feedback: {
    averageRating: {
      type: Number,
      default: 0
    },
    totalRatings: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create email template model if it doesn't exist
const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema);

/**
 * Categorize incoming emails
 * @param {Object} email - Email object containing subject and body
 */
exports.categorizeEmail = async (email) => {
  try {
    const prompt = `
# Role:
You are a highly skilled customer support specialist working for a SaaS company specializing in AI agent design. Your expertise lies in understanding customer intent and meticulously categorizing emails to ensure they are handled efficiently.

# Instructions:
1. Review the provided email content thoroughly.
2. Use the following rules to assign the correct category:
   - **product_inquiry**: When the email seeks information about a product feature, benefit, service, or pricing.
   - **customer_complaint**: When the email communicates dissatisfaction or a complaint.
   - **customer_feedback**: When the email provides feedback or suggestions regarding a product or service.
   - **unrelated**: When the email content does not match any of the above categories.

# EMAIL CONTENT:
Subject: ${email.subject}

${email.body}

# Notes:
* Base your categorization strictly on the email content provided; avoid making assumptions or overgeneralizing.
* Output format: Return ONLY the category name with no additional text or explanation.
`;

    try {
      // Try with Vertex AI first
      const result = await generativeModel.generateContent(prompt);
      const response = result.response.text().toLowerCase().trim();
      
      if (response.includes('product_inquiry')) return 'product_inquiry';
      if (response.includes('customer_complaint')) return 'customer_complaint';
      if (response.includes('customer_feedback')) return 'customer_feedback';
      return 'unrelated';
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.1,
        max_tokens: 50
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        const response = ollamaResponse.data.response.toLowerCase().trim();
        
        if (response.includes('product_inquiry')) return 'product_inquiry';
        if (response.includes('customer_complaint')) return 'customer_complaint';
        if (response.includes('customer_feedback')) return 'customer_feedback';
        return 'unrelated';
      }
      
      throw new Error('Failed to categorize email with Ollama');
    }
  } catch (error) {
    console.error('Error categorizing email:', error);
    return 'unrelated'; // Default to unrelated
  }
};

/**
 * Generate email drip campaign sequence
 * @param {Object} options - Options for drip campaign generation
 */
exports.generateDripCampaign = async (options) => {
  try {
    const {
      userId,
      campaignName,
      goal,
      numberOfEmails = 5,
      audienceType,
      industry,
      productInfo,
      tone,
      includeCTA = true
    } = options;

    // Build prompt for drip campaign generation
    const prompt = `
# Role:
You are an expert email marketing strategist who specializes in designing effective drip campaigns.

# Task:
Design a ${numberOfEmails}-email drip campaign sequence.

# Campaign Details:
Campaign Name: ${campaignName}
Primary Goal: ${goal || 'Conversion'}
Target Audience: ${audienceType || 'General'}
Industry: ${industry || 'General'}
Product/Service Info: ${productInfo || 'Not specified'}
Tone: ${tone || 'Professional'}
Include CTAs: ${includeCTA ? 'Yes' : 'No'}

# Instructions:
1. Create a strategic sequence of ${numberOfEmails} emails that guides recipients toward the campaign goal
2. For each email, provide:
   - A number and suggested send timing (e.g., "Email 1: Immediately after signup")
   - A compelling subject line
   - The email purpose/goal
   - A brief outline of content (200-300 words)
   - Suggested call-to-action (if applicable)
3. Ensure a logical progression throughout the sequence
4. Vary the approach, length, and content type across emails
5. Maintain consistent tone across all emails

# Output:
Format each email in the sequence as follows:

## EMAIL [number]: [timing]
**Subject:** [subject line]
**Purpose:** [purpose/goal]
**Content:**
[email content outline]
**CTA:** [call-to-action]

---
`;

    try {
      // Use the marketing model for drip campaigns
      const result = await marketingModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      });

      const dripCampaignContent = result.response.text();

      // Process the drip campaign content into structured data
      const emails = parseDripCampaign(dripCampaignContent, numberOfEmails);

      return {
        success: true,
        campaignName,
        goal,
        emails
      };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.7,
        max_tokens: 4096
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        const dripCampaignContent = ollamaResponse.data.response;

        // Process the drip campaign content into structured data
        const emails = parseDripCampaign(dripCampaignContent, numberOfEmails);

        return {
          success: true,
          campaignName,
          goal,
          emails
        };
      }
      
      throw new Error('Failed to generate drip campaign with Ollama');
    }
  } catch (error) {
    console.error('Error generating drip campaign:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Parse drip campaign text into structured data
 * @param {string} campaignText - Raw campaign text
 * @param {number} expectedCount - Expected number of emails
 */
function parseDripCampaign(campaignText, expectedCount) {
  // Split the text by email sections
  const emailSections = campaignText.split(/##\s*EMAIL\s+\d+/i).slice(1);
  const emails = [];

  for (let i = 0; i < emailSections.length; i++) {
    const section = emailSections[i];

    // Extract details using regex
    const timingMatch = section.match(/:\s*([^\n]+)/);
    const subjectMatch = section.match(/\*\*Subject:\*\*\s*([^\n]+)/i);
    const purposeMatch = section.match(/\*\*Purpose:\*\*\s*([^\n]+)/i);
    const ctaMatch = section.match(/\*\*CTA:\*\*\s*([^\n]+)/i);

    // Extract content between Purpose and CTA
    let content = '';
    const contentStart = section.indexOf('**Content:**');
    const contentEnd = section.indexOf('**CTA:**');

    if (contentStart !== -1) {
      const startPos = contentStart + '**Content:**'.length;
      const endPos = contentEnd !== -1 ? contentEnd : section.length;
      content = section.substring(startPos, endPos).trim();
    }

    emails.push({
      number: i + 1,
      timing: timingMatch ? timingMatch[1].trim() : `Email ${i + 1}`,
      subject: subjectMatch ? subjectMatch[1].trim() : `Subject for Email ${i + 1}`,
      purpose: purposeMatch ? purposeMatch[1].trim() : '',
      content: content,
      cta: ctaMatch ? ctaMatch[1].trim() : ''
    });

    // Only process the expected number of emails
    if (emails.length >= expectedCount) break;
  }

  // If we got fewer emails than expected, pad with empty templates
  while (emails.length < expectedCount) {
    const num = emails.length + 1;
    emails.push({
      number: num,
      timing: `Email ${num}`,
      subject: `Subject for Email ${num}`,
      purpose: '',
      content: '',
      cta: ''
    });
  }

  return emails;
}

/**
 * Record feedback on a response for RLHF
 * @param {string} responseId - ID of the response
 * @param {Object} feedbackData - Feedback data
 */
exports.recordResponseFeedback = async (responseId, feedbackData) => {
  try {
    return await rlhfService.recordFeedback(responseId, feedbackData);
  } catch (error) {
    console.error('Error recording response feedback:', error);
    throw error;
  }
};

/**
 * Get feedback statistics for RLHF
 */
exports.getFeedbackStatistics = async () => {
  try {
    return await rlhfService.getFeedbackStats();
  } catch (error) {
    console.error('Error getting feedback statistics:', error);
    throw error;
  }
};

/**
 * Suggest improvements for a specific email to improve engagement
 * @param {Object} options - Email improvement options
 */
exports.suggestEmailImprovements = async (options) => {
  try {
    const {
      emailContent,
      currentOpenRate,
      industry,
      audience,
      goal
    } = options;

    // Build prompt for email improvement suggestions
    const prompt = `
# Role:
You are an email optimization specialist who helps marketers improve their email performance.

# Task:
Analyze the provided email and suggest specific improvements to increase engagement.

# Email Details:
Current Open Rate: ${currentOpenRate || 'Unknown'}%
Industry: ${industry || 'General'}
Target Audience: ${audience || 'General'}
Email Goal: ${goal || 'Engagement'}

# Email Content:
${emailContent}

# Instructions:
1. Analyze the email above for potential issues that might be limiting engagement
2. Provide specific, actionable suggestions to improve:
   - Subject line
   - Preview text
   - Opening paragraph
   - Overall structure
   - Call-to-action
   - Visual elements (if mentioned)
   - Personalization opportunities
3. Suggest A/B testing opportunities
4. Provide at least 5 specific recommendations
5. For each recommendation, explain why it would improve performance

# Output:
Format your response as a structured analysis with clear sections for each area of improvement.
`;

    try {
      // Use the standard model for analysis
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048
        }
      });

      return {
        success: true,
        suggestions: result.response.text()
      };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.4,
        max_tokens: 2048
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        return {
          success: true,
          suggestions: ollamaResponse.data.response
        };
      }
      
      throw new Error('Failed to generate improvement suggestions with Ollama');
    }
  } catch (error) {
    console.error('Error suggesting email improvements:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate RAG queries
 * @param {string} emailBody - The body of the email
 */
exports.generateRAGQueries = async (emailBody) => {
  try {
    const prompt = `
# Role:
You are an expert at analyzing customer emails to extract their intent and construct the most relevant queries for internal knowledge sources.

# Context:
You will be given the text of an email from a customer. This email represents their specific query or concern. Your goal is to interpret their request and generate precise questions that capture the essence of their inquiry.

# Instructions:
1. Carefully read and analyze the email content provided.
2. Identify the main intent or problem expressed in the email.
3. Construct up to THREE concise, relevant questions that best represent the customer's intent or information needs.
4. Return ONLY the questions, one per line, with no additional text.

# EMAIL CONTENT:
${emailBody}
`;

    try {
      // Try with Vertex AI first
      const result = await generativeModel.generateContent(prompt);
      const response = result.response.text();
      
      // Parse out the questions (one per line)
      const queries = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && (line.includes('?') || /^\d+\./.test(line)));
      
      return queries.length > 0 ? queries : [emailBody.substring(0, 100)]; // Truncate email body as fallback
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.3,
        max_tokens: 200
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        const response = ollamaResponse.data.response;
        
        // Parse out the questions (one per line)
        const queries = response.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && (line.includes('?') || /^\d+\./.test(line)));
        
        return queries.length > 0 ? queries : [emailBody.substring(0, 100)]; // Truncate email body as fallback
      }
      
      throw new Error('Failed to generate RAG queries with Ollama');
    }
  } catch (error) {
    console.error('Error generating RAG queries:', error);
    return [emailBody.substring(0, 100)]; // Truncate email body as fallback
  }
};

/**
 * Generate email response for customer service
 * @param {Object} email - Email object
 * @param {string} category - Email category
 * @param {string} retrievedInfo - Information retrieved from knowledge base
 */
exports.generateResponse = async (email, category, retrievedInfo = '') => {
  try {
    // First try the RLHF-improved model
    try {
      return await rlhfService.generateImprovedResponse(email, category, retrievedInfo);
    } catch (rlhfError) {
      console.warn('RLHF generation failed, falling back to standard model:', rlhfError);
      
      // Fall back to standard generation
      const prompt = `
# Role:  
You are a professional email writer working as part of the customer support team at a company specializing in AI-powered software. Your role is to draft thoughtful and friendly emails that effectively address customer queries based on the given category and relevant information.  

# Email Details:
Category: ${category}
Subject: ${email.subject}
Customer Email: ${email.body.substring(0, 500)}${email.body.length > 500 ? '...' : ''}

${retrievedInfo ? `# Additional Information:\n${retrievedInfo}` : ''}

# Instructions:
1. Write a personalized email response addressing the customer's inquiry.
2. Be professional, helpful, and friendly in tone.
3. Use the information from the "Additional Information" section if provided.
4. Include a clear call-to-action when appropriate.
5. Keep the email concise but comprehensive.
6. Format with a proper greeting and closing.
7. Do not make up information - stick to what's provided in the additional information section.
8. Be empathetic, especially for complaints.

# Output:
Write the complete email response without any preamble or explanation.
`;

      try {
        // Try with Vertex AI first
        const result = await generativeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        });
        
        return result.response.text();
      } catch (error) {
        console.warn('Vertex AI error, falling back to Ollama:', error);
        
        // Fallback to Ollama
        const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
          model: DEFAULT_MODEL,
          prompt,
          temperature: 0.7,
          max_tokens: 1024
        });
        
        if (ollamaResponse.data && ollamaResponse.data.response) {
          return ollamaResponse.data.response;
        }
        
        throw new Error('Failed to generate response with Ollama');
      }
    }
  } catch (error) {
    console.error('Error generating response:', error);
    // Fallback to template-based response
    return generateTemplateResponse(email, category);
  }
};

/**
 * Quality check the response
 * @param {string} originalEmail - Original email content
 * @param {string} response - Generated response
 */
exports.qualityCheckResponse = async (originalEmail, response) => {
  try {
    const prompt = `
# Role:
You are an expert email proofreader. Your job is to ensure emails meet quality standards.

# Instructions:
Analyze this email reply for:
1. Professionalism
2. Relevance to the customer's inquiry
3. Clarity and completeness

If there are ANY significant issues that would negatively impact customer satisfaction, respond with:
SENDABLE: false
FEEDBACK: [specific issues that need fixing]

If the email is good to send, respond with:
SENDABLE: true

# ORIGINAL EMAIL:
${originalEmail.substring(0, 300)}${originalEmail.length > 300 ? '...' : ''}

# GENERATED REPLY:
${response}

# Notes:
* Be objective - only flag real problems.
* Return ONLY the SENDABLE status and feedback (if needed).
`;

    try {
      // Try with Vertex AI first
      const result = await generativeModel.generateContent(prompt);
      const content = result.response.text().toLowerCase();
      
      const isGood = content.includes('sendable: true');
      const feedbackMatch = content.match(/feedback:(.*)/is);
      const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
      
      return { isGood, feedback };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.3,
        max_tokens: 200
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        const content = ollamaResponse.data.response.toLowerCase();
        
        const isGood = content.includes('sendable: true');
        const feedbackMatch = content.match(/feedback:(.*)/is);
        const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
        
        return { isGood, feedback };
      }
      
      throw new Error('Failed to quality check response with Ollama');
    }
  } catch (error) {
    console.error('Error in quality check:', error);
    return { isGood: true, feedback: 'Error in quality check, proceeding with caution' };
  }
};

/**
 * Generate embedding vector for text
 * @param {string} text - Text to generate embedding for
 */
exports.getEmbedding = async (text) => {
  try {
    // Try with Vertex AI Embeddings
    try {
      const embeddingModel = vertexAI.getTextEmbeddingModel({
        model: process.env.VERTEX_AI_EMBEDDING_MODEL || 'textembedding-gecko@003'
      });
      
      const embeddingResult = await embeddingModel.getEmbeddings([text]);
      
      if (embeddingResult && embeddingResult.embeddings && embeddingResult.embeddings.length > 0) {
        return {
          success: true,
          embedding: embeddingResult.embeddings[0].values
        };
      }
    } catch (error) {
      console.warn('Vertex AI embedding error, falling back to Ollama:', error);
    }
    
    // Fallback to Ollama embeddings
    const ollamaResponse = await axios.post(`${OLLAMA_API}/embeddings`, {
      model: DEFAULT_MODEL,
      prompt: text
    });
    
    if (ollamaResponse.data && ollamaResponse.data.embedding) {
      return {
        success: true,
        embedding: ollamaResponse.data.embedding
      };
    }
    
    throw new Error('Failed to get embedding from Ollama');
  } catch (error) {
    console.error('Error getting embedding:', error);
    return {
      success: false,
      error: error.message,
      embedding: null
    };
  }
};

/**
 * Generate a personalized email from a template for marketing purposes
 * @param {Object} options - Options for generation
 */
exports.generatePersonalizedEmail = async (options) => {
  try {
    const { contactData, campaignPrompt, model, temperature, scrapedData = [] } = options;
    
    // Prepare context from contact data - limit the amount of data to avoid overloading
    const contactContext = Object.entries(contactData)
      .filter(([key]) => !key.includes('Description') && !key.includes('Notes')) // Filter out long fields
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Prepare context from scraped data - limit to most important parts
    const scrapedContext = scrapedData.length > 0
      ? `\nAdditional Information:\n${scrapedData.slice(0, 2).join('\n')}` // Limit to first 2 items
      : '';

    // Build a compact prompt to reduce token usage
    const prompt = `
Write a personalized email based on:

RECIPIENT DATA:
${contactContext}

${scrapedContext}

CAMPAIGN GUIDELINES:
${campaignPrompt}

INSTRUCTIONS:
1. Write a personalized email that speaks directly to this recipient
2. Use their information naturally throughout the email
3. Follow the campaign guidelines
4. Format with greeting, body, and signature
5. Keep it concise (under 250 words)

Write only the email content:
`;

    try {
      // Try with Vertex AI first - using the marketing model for email campaigns
      const result = await marketingModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: parseFloat(temperature) || 0.7,
          maxOutputTokens: 1024
        }
      });
      
      return {
        success: true,
        content: result.response.text(),
        model: 'gemini-pro',
        temperature
      };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: model || DEFAULT_MODEL,
        prompt,
        temperature: parseFloat(temperature) || 0.7,
        max_tokens: 1024
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        return {
          success: true,
          content: ollamaResponse.data.response,
          model: model || DEFAULT_MODEL,
          temperature
        };
      }
      
      throw new Error('Failed to generate email with Ollama');
    }
  } catch (error) {
    console.error('Error generating personalized email:', error);
    return {
      success: false,
      error: error.message,
      content: null
    };
  }
};

/**
 * Create a new email template with AI assistance
 * @param {Object} options - Template generation options
 * @param {string} options.userId - User ID
 * @param {string} options.name - Template name
 * @param {string} options.industry - Industry for targeting
 * @param {string} options.purpose - Purpose of the email (promotional, newsletter, etc.)
 * @param {string} options.tone - Desired tone (formal, casual, etc.)
 * @param {string} options.length - Desired length (short, medium, long)
 * @param {string} options.target - Target audience
 * @param {string} options.customInstructions - Any specific instructions
 */
exports.createEmailTemplate = async (options) => {
  try {
    const {
      userId,
      name,
      industry,
      purpose,
      tone,
      length,
      target,
      customInstructions
    } = options;

    // Build a base prompt to generate the template
    const basePrompt = `
# Role:
You are an expert email marketing copywriter specializing in creating high-converting email templates.

# Task:
Create a professional email template for the following specifications:

* Industry: ${industry || 'General'}
* Purpose: ${purpose || 'Marketing'}
* Tone: ${tone || 'Professional'}
* Length: ${length || 'Medium'}
* Target Audience: ${target || 'General'}
${customInstructions ? `* Special Instructions: ${customInstructions}` : ''}

# Instructions:
1. Create a template with placeholder variables in {BRACKETS} that can be replaced with actual values
2. Include a compelling subject line suggestion at the beginning (marked as SUBJECT: )
3. Create an engaging opening that grabs attention
4. Include persuasive body content that delivers value
5. End with a clear call-to-action
6. The template should be versatile enough to be personalized for different recipients
7. The email should be designed to achieve the specified purpose
8. Maintain the requested tone throughout the email

# Output:
Provide only the email template with no explanations.
`;

    try {
      // Generate the template using the marketing-specific model
      const result = await marketingModel.generateContent(basePrompt);
      const generatedTemplate = result.response.text();

      // Save the template to the database
      const emailTemplate = new EmailTemplate({
        userId,
        name,
        content: generatedTemplate,
        industry,
        purpose,
        tone,
        length,
        target,
        customInstructions,
        basePrompt
      });

      await emailTemplate.save();

      return {
        success: true,
        template: emailTemplate
      };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt: basePrompt,
        temperature: 0.7,
        max_tokens: 2048
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        const generatedTemplate = ollamaResponse.data.response;

        // Save the template to the database
        const emailTemplate = new EmailTemplate({
          userId,
          name,
          content: generatedTemplate,
          industry,
          purpose,
          tone,
          length,
          target,
          customInstructions,
          basePrompt
        });

        await emailTemplate.save();

        return {
          success: true,
          template: emailTemplate
        };
      }
      
      throw new Error('Failed to generate email template with Ollama');
    }
  } catch (error) {
    console.error('Error creating email template:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate campaign-specific emails from a template
 * @param {Object} options - Options for the campaign emails
 * @param {string} options.templateId - ID of the template to use
 * @param {Array} options.recipients - Array of recipient data
 * @param {string} options.campaignContext - Additional context for the campaign
 * @param {boolean} options.enhanceWithAI - Whether to enhance with AI
 */
exports.generateCampaignEmails = async (options) => {
  try {
    const {
      templateId,
      recipients,
      campaignContext,
      enhanceWithAI = false
    } = options;

    // Get the template from the database
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      throw new Error('Email template not found');
    }

    // Update usage count
    template.usageCount += 1;
    await template.save();

    const results = [];

    // Generate personalized emails for each recipient
    for (const recipient of recipients) {
      try {
        let personalized;

        if (enhanceWithAI) {
          // Use AI to generate a completely personalized email based on the template
          personalized = await enhanceEmailWithAI(template, recipient, campaignContext);
        } else {
          // Simple variable replacement in the template
          personalized = replaceVariables(template.content, recipient);
        }

        results.push({
          recipient: recipient.email,
          personalized,
          success: true
        });
      } catch (error) {
        console.error(`Error generating email for ${recipient.email}:`, error);

        // Fallback to simple replacement
        const fallback = replaceVariables(template.content, recipient);

        results.push({
          recipient: recipient.email,
          personalized: fallback,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      template: template.name,
      results
    };
  } catch (error) {
    console.error('Error generating campaign emails:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enhance an email template with AI personalization
 * @param {Object} template - The email template
 * @param {Object} recipient - Recipient data
 * @param {string} campaignContext - Campaign context
 */
async function enhanceEmailWithAI(template, recipient, campaignContext) {
  const prompt = `
# Role:
You are an expert email marketing copywriter who specializes in personalization.

# Task:
Personalize the following email template for a specific recipient based on their data.

# Recipient Data:
${Object.entries(recipient)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

# Campaign Context:
${campaignContext || 'Standard marketing campaign'}

# Email Template:
${template.content}

# Template Info:
Industry: ${template.industry || 'General'}
Purpose: ${template.purpose || 'Marketing'}
Tone: ${template.tone || 'Professional'}

# Instructions:
1. Create a highly personalized version of the template for this specific recipient
2. Reference their specific data naturally throughout the email
3. Maintain the original purpose and tone of the template
4. Keep the same general structure but make it feel individually crafted
5. Replace all placeholder variables with actual values
6. Add 1-2 recipient-specific details that weren't explicitly in the template
7. Ensure any call-to-action is relevant to the recipient

# Output:
Provide only the personalized email with no explanations.
`;

  try {
    // Use the marketing model for better personalization
    const result = await marketingModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    });

    return result.response.text();
  } catch (error) {
    console.warn('AI enhancement failed, falling back to Ollama:', error);
    
    // Fallback to Ollama
    const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
      model: DEFAULT_MODEL,
      prompt,
      temperature: 0.7,
      max_tokens: 2048
    });
    
    if (ollamaResponse.data && ollamaResponse.data.response) {
      return ollamaResponse.data.response;
    }
    
    throw new Error('Failed to enhance email with AI');
  }
}

/**
 * Simple variable replacement in templates
 * @param {string} template - Template string
 * @param {Object} data - Data for replacement
 */
function replaceVariables(template, data) {
  let result = template;

  // Replace variables in {BRACKETS} with corresponding values
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'gi');
    result = result.replace(regex, value || '');
  });

  // Replace any remaining variables with empty string
  result = result.replace(/{[^}]+}/g, '');

  return result;
}

/**
 * Analyze email campaign performance
 * @param {Object} campaignData - Campaign performance data
 */
exports.analyzeCampaignPerformance = async (campaignData) => {
  try {
    const {
      campaignId,
      campaignName,
      emailsSent,
      emailsOpened,
      emailsClicked,
      emailsBounced,
      emailsUnsubscribed,
      industry,
      audienceSize
    } = campaignData;

    // Calculate key metrics
    const openRate = (emailsOpened / emailsSent) * 100;
    const clickRate = (emailsClicked / emailsSent) * 100;
    const clickToOpenRate = (emailsClicked / emailsOpened) * 100;
    const bounceRate = (emailsBounced / emailsSent) * 100;
    const unsubscribeRate = (emailsUnsubscribed / emailsSent) * 100;

    // Build analysis prompt
    const prompt = `
# Role:
You are an expert email marketing analyst who specializes in campaign performance analysis.

# Task:
Analyze the following email campaign performance and provide actionable insights.

# Campaign Data:
Campaign Name: ${campaignName}
Industry: ${industry || 'General'}
Audience Size: ${audienceSize}
Emails Sent: ${emailsSent}
Emails Opened: ${emailsOpened} (${openRate.toFixed(2)}%)
Emails Clicked: ${emailsClicked} (${clickRate.toFixed(2)}%)
Click-to-Open Rate: ${clickToOpenRate.toFixed(2)}%
Bounce Rate: ${bounceRate.toFixed(2)}%
Unsubscribe Rate: ${unsubscribeRate.toFixed(2)}%

# Instructions:
1. Evaluate the performance metrics against industry standards
2. Identify strengths and areas for improvement
3. Provide 3-5 specific, actionable recommendations to improve future campaigns
4. Suggest A/B testing ideas based on the data
5. Format your response in a structured, easy-to-read format

# Output:
Provide a concise analysis with clear sections for:
- Performance Summary
- Key Insights
- Actionable Recommendations
- Testing Ideas
`;

    try {
      // Use the standard model for analysis
      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more factual analysis
          maxOutputTokens: 1024
        }
      });

      return {
        success: true,
        analysis: result.response.text(),
        metrics: {
          openRate: parseFloat(openRate.toFixed(2)),
          clickRate: parseFloat(clickRate.toFixed(2)),
          clickToOpenRate: parseFloat(clickToOpenRate.toFixed(2)),
          bounceRate: parseFloat(bounceRate.toFixed(2)),
          unsubscribeRate: parseFloat(unsubscribeRate.toFixed(2))
        }
      };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.3,
        max_tokens: 1024
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        return {
          success: true,
          analysis: ollamaResponse.data.response,
          metrics: {
            openRate: parseFloat(openRate.toFixed(2)),
            clickRate: parseFloat(clickRate.toFixed(2)),
            clickToOpenRate: parseFloat(clickToOpenRate.toFixed(2)),
            bounceRate: parseFloat(bounceRate.toFixed(2)),
            unsubscribeRate: parseFloat(unsubscribeRate.toFixed(2))
          }
        };
      }
      
      throw new Error('Failed to analyze campaign with Ollama');
    }
  } catch (error) {
    console.error('Error analyzing campaign performance:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate subject line variations for A/B testing
 * @param {Object} options - Options for subject line generation
 */
exports.generateSubjectLines = async (options) => {
  try {
    const {
      baseSubject,
      emailContent,
      audience,
      industry,
      count = 5,
      purpose,
      style
    } = options;

    // Build prompt for subject line generation
    const prompt = `
# Role:
You are an expert email marketer who specializes in crafting high-performing subject lines.

# Task:
Generate ${count} unique and compelling email subject line variations for A/B testing.

# Context:
Base Subject Line: ${baseSubject || 'N/A'}
Email Purpose: ${purpose || 'Marketing/Promotional'}
Target Audience: ${audience || 'General'}
Industry: ${industry || 'General'}
Style Preference: ${style || 'Professional'}

# Email Content Preview:
${emailContent ? emailContent.substring(0, 300) + '...' : 'Not provided'}

# Instructions:
1. Create ${count} distinct subject line variations that would improve open rates
2. Each subject line should be different in approach but maintain the core message
3. Include a mix of approaches (question, curiosity, urgency, personalization, etc.)
4. Keep subject lines under 50 characters when possible
5. Avoid clickbait or spammy phrases that might trigger spam filters
6. Number each subject line variation

# Output:
Provide only numbered subject lines, one per line.
`;

    try {
      // Use the marketing model for creative subject lines
      const result = await marketingModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8, // Higher temperature for creativity
          maxOutputTokens: 512
        }
      });

      // Parse the response into an array of subject lines
      const subjectLines = result.response.text()
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          // Remove number prefix (e.g., "1. " or "1) ")
          return line.replace(/^\d+[\.\)]\s*/, '').trim();
        })
        .filter(line => line); // Remove any empty lines

      return {
        success: true,
        subjectLines: subjectLines.slice(0, count) // Ensure we only return the requested count
      };
    } catch (error) {
      console.warn('Vertex AI error, falling back to Ollama:', error);
      
      // Fallback to Ollama
      const ollamaResponse = await axios.post(`${OLLAMA_API}/generate`, {
        model: DEFAULT_MODEL,
        prompt,
        temperature: 0.8,
        max_tokens: 512
      });
      
      if (ollamaResponse.data && ollamaResponse.data.response) {
        // Parse the response into an array of subject lines
        const subjectLines = ollamaResponse.data.response
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            // Remove number prefix (e.g., "1. " or "1) ")
            return line.replace(/^\d+[\.\)]\s*/, '').trim();
          })
          .filter(line => line); // Remove any empty lines

        return {
          success: true,
          subjectLines: subjectLines.slice(0, count) // Ensure we only return the requested count
        };
      }
      
      throw new Error('Failed to generate subject lines with Ollama');
    }
  } catch (error) {
    console.error('Error generating subject lines:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Scrape company information from the web
 * @param {string} companyName - The company to scrape information about
 * @param {string} domainName - Optional company website
 */
exports.scrapeCompanyInfo = async (companyName, domainName = null) => {
  try {
    const results = [];
    
    // If domain is provided, do minimal scraping
    if (domainName) {
      try {
        const websiteUrl = domainName.startsWith('http') ? domainName : `https://${domainName}`;
        const response = await axios.get(websiteUrl, { 
          timeout: 3000,  // Reduced timeout
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EmailMarketingAssistant/1.0)' }
        });
        
        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          
          // Get meta description
          const metaDescription = $('meta[name="description"]').attr('content');
          if (metaDescription) {
            results.push(`Company Description: ${metaDescription}`);
          }
          
          // Get a bit more info if available
          const title = $('title').text();
          if (title) {
            results.push(`Website Title: ${title}`);
          }
          
          // Try to get company info from about section
          const aboutText = $('*:contains("About")').closest('section').text();
          if (aboutText && aboutText.length > 100) {
            const truncated = aboutText.substring(0, 300);
            results.push(`About: ${truncated}...`);
          }
        }
      } catch (err) {
        console.warn(`Could not scrape website ${domainName}:`, err.message);
      }
    }
    
    // If no results from website, try to generate some context about the company
    if (results.length === 0) {
      try {
        const prompt = `Provide 2-3 brief, factual statements about ${companyName}. 
        If you don't have specific information about this company, respond ONLY with: "Company: ${companyName}"`;
        
        // Try with Vertex AI
        const result = await generativeModel.generateContent(prompt);
        const content = result.response.text();
        
        if (!content.includes(`Company: ${companyName}`)) {
          // Split the content into lines and add each as a separate result
          const lines = content.split('\n').filter(line => line.trim().length > 0);
          lines.forEach(line => results.push(line));
        } else {
          results.push(`Company: ${companyName}`);
        }
      } catch (err) {
        console.warn('Error generating company info:', err);
        results.push(`Company: ${companyName}`);
      }
    }
    
    return {
      success: results.length > 0,
      data: results,
      source: domainName || 'AI generated'
    };
  } catch (error) {
    console.error('Error scraping company info:', error);
    return {
      success: false,
      data: [`Company: ${companyName}`],
      error: error.message
    };
  }
};

// Helper function to generate a template-based response when AI fails
function generateTemplateResponse(email, category) {
  // Extract customer name if possible
  const nameMatch = email.from.match(/^([^<]+)/);
  const customerName = nameMatch ? nameMatch[1].trim() : "Customer";
  
  // Templates for different categories
  const templates = {
    product_inquiry: `
Dear ${customerName},

Thank you for your interest in our services. I appreciate you reaching out to us.

We offer a range of solutions, and I'd be happy to provide you with more information. Could you please let me know which specific features or aspects you're most interested in?

I'm here to help and can schedule a personalized demo to show you how our product can meet your needs.

Best regards,
Customer Support Team
`,
    customer_complaint: `
Dear ${customerName},

I sincerely apologize for the issues you've experienced. We take all feedback seriously and are committed to resolving your concerns promptly.

I understand your frustration, and I want to assure you that we're taking immediate steps to address the situation. Our team is reviewing the details of your case, and we'll be implementing measures to ensure this doesn't happen again.

Would it be possible to schedule a call to discuss this matter in more detail? This would help us better understand your concerns and work toward a resolution that meets your expectations.

Thank you for bringing this to our attention. We value your business and are dedicated to making things right.

Best regards,
Customer Support Team
`,
    customer_feedback: `
Dear ${customerName},

Thank you for taking the time to share your feedback with us. We truly value the insights our customers provide, as they help us improve our services and better meet your needs.

Your comments have been noted and shared with our team. We're constantly working to enhance our offerings, and feedback like yours is instrumental in guiding those improvements.

Is there anything else you'd like to share or any questions I can answer for you? We're always here to help and appreciate your continued support.

Best regards,
Customer Support Team
`,
    unrelated: `
Dear ${customerName},

Thank you for your message. We appreciate you reaching out to us.

We've received your email and will review your inquiry promptly. If we need any additional information, we'll be sure to contact you.

In the meantime, please don't hesitate to let us know if you have any other questions or concerns.

Best regards,
Customer Support Team
`
  };
  
  return templates[category] || templates.unrelated;
}