const { VertexAI } = require('@google-cloud/vertexai');
const Feedback = require('../../models/Feedback');
const KnowledgeBase = require('../../models/KnowledgeBase');
const fs = require('fs').promises;
const path = require('path');

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.VERTEX_AI_LOCATION || 'us-central1'
});

// Track training status
const trainingStatus = {
  isTraining: false,
  lastTrainingTime: null,
  totalExamples: 0,
  currentModel: process.env.CUSTOM_MODEL_NAME || process.env.VERTEX_AI_MODEL
};

// Feedback queue - store feedback that needs to be processed
const feedbackQueue = [];

// Dataset paths
const DATASETS_DIR = path.join(__dirname, '../../../data/rlhf_datasets');

/**
 * Process feedback for RLHF
 * @param {Object} feedback - Feedback object from database
 */
exports.processFeedback = async (feedback) => {
  try {
    // Add to queue for processing
    feedbackQueue.push(feedback._id);
    
    // Process queue if not already processing
    if (feedbackQueue.length === 1) {
      processFeedbackQueue();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error processing feedback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get training metrics
 * @param {string} userId - User ID
 */
exports.getTrainingMetrics = async (userId) => {
  try {
    // Get user-specific metrics
    const totalUserFeedback = await Feedback.countDocuments({ user: userId });
    
    return {
      trainingStatus: trainingStatus.isTraining ? 'in_progress' : 'idle',
      lastTrainingTime: trainingStatus.lastTrainingTime,
      totalFeedbackCollected: totalUserFeedback,
      totalExamplesUsed: trainingStatus.totalExamples,
      currentModel: trainingStatus.currentModel,
      queueSize: feedbackQueue.length
    };
  } catch (error) {
    console.error('Error getting training metrics:', error);
    return {
      error: error.message
    };
  }
};

/**
 * Process the feedback queue
 */
async function processFeedbackQueue() {
  if (feedbackQueue.length === 0) return;
  
  try {
    // Get feedback ID from queue
    const feedbackId = feedbackQueue[0];
    
    // Get full feedback record with populated automatedEmail
    const feedback = await Feedback.findById(feedbackId)
      .populate('automatedEmail');
    
    if (!feedback) {
      // Remove from queue if not found
      feedbackQueue.shift();
      return processFeedbackQueue();
    }
    
    // Convert to training example
    await convertToTrainingExample(feedback);
    
    // If we have enough examples, trigger training
    const exampleCount = await countTrainingExamples();
    
    if (exampleCount > 0 && exampleCount % 50 === 0) {
      // We have 50 new examples, trigger training
      triggerRLHFTraining();
    }
    
    // Remove from queue
    feedbackQueue.shift();
    
    // Process next item
    processFeedbackQueue();
  } catch (error) {
    console.error('Error processing feedback queue:', error);
    
    // Remove problematic feedback from queue to avoid blocking
    feedbackQueue.shift();
    
    // Continue processing
    processFeedbackQueue();
  }
}

/**
 * Convert feedback to training example
 * @param {Object} feedback - Feedback object from database
 */
async function convertToTrainingExample(feedback) {
  try {
    // Create directories if they don't exist
    await fs.mkdir(DATASETS_DIR, { recursive: true });
    
    // Prepare example data
    const email = feedback.automatedEmail;
    
    // Different processing based on feedback type
    if (feedback.feedbackType === 'edit') {
      // This is a comparison example - original vs improved
      const example = {
        original_query: email.body,
        original_response: feedback.originalResponse,
        improved_response: feedback.improvedResponse,
        category: email.category,
        improvement_areas: feedback.improvements
      };
      
      // Write to comparison dataset
      await appendToJsonFile(
        path.join(DATASETS_DIR, 'comparison_examples.jsonl'),
        example
      );
    } else if (feedback.feedbackType === 'approve') {
      // This is a positive example
      const example = {
        query: email.body,
        response: feedback.originalResponse,
        category: email.category,
        rating: feedback.rating,
        is_positive: true
      };
      
      // Write to preference dataset
      await appendToJsonFile(
        path.join(DATASETS_DIR, 'preference_examples.jsonl'),
        example
      );
    } else if (feedback.feedbackType === 'reject') {
      // This is a negative example
      const example = {
        query: email.body,
        response: feedback.originalResponse,
        category: email.category,
        rating: feedback.rating,
        is_positive: false,
        issues: feedback.improvements,
        feedback_notes: feedback.feedbackNotes
      };
      
      // Write to preference dataset
      await appendToJsonFile(
        path.join(DATASETS_DIR, 'preference_examples.jsonl'),
        example
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error converting feedback to training example:', error);
    throw error;
  }
}

/**
 * Append JSON object to a JSONL file
 * @param {string} filePath - Path to JSONL file
 * @param {Object} jsonObject - JSON object to append
 */
async function appendToJsonFile(filePath, jsonObject) {
  try {
    const jsonLine = JSON.stringify(jsonObject) + '\n';
    await fs.appendFile(filePath, jsonLine);
  } catch (error) {
    console.error(`Error appending to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Count training examples
 */
async function countTrainingExamples() {
  try {
    const comparisonPath = path.join(DATASETS_DIR, 'comparison_examples.jsonl');
    const preferencePath = path.join(DATASETS_DIR, 'preference_examples.jsonl');
    
    // Check if files exist
    const [comparisonExists, preferenceExists] = await Promise.all([
      fs.access(comparisonPath).then(() => true).catch(() => false),
      fs.access(preferencePath).then(() => true).catch(() => false)
    ]);
    
    let totalCount = 0;
    
    // Count lines in comparison file
    if (comparisonExists) {
      const comparisonData = await fs.readFile(comparisonPath, 'utf8');
      totalCount += comparisonData.split('\n').filter(line => line.trim()).length;
    }
    
    // Count lines in preference file
    if (preferenceExists) {
      const preferenceData = await fs.readFile(preferencePath, 'utf8');
      totalCount += preferenceData.split('\n').filter(line => line.trim()).length;
    }
    
    return totalCount;
  } catch (error) {
    console.error('Error counting training examples:', error);
    return 0;
  }
}

/**
 * Trigger RLHF training
 */
async function triggerRLHFTraining() {
  // If already training, don't start another job
  if (trainingStatus.isTraining) return;
  
  try {
    trainingStatus.isTraining = true;
    console.log('Starting RLHF training...');
    
    // In a production system, this would:
    // 1. Upload the dataset files to Google Cloud Storage
    // 2. Trigger a Vertex AI fine-tuning job
    // 3. Wait for the job to complete
    // 4. Update the model being used
    
    // For demonstration, we'll simulate a training process
    await simulateTraining();
    
    // Update training status
    trainingStatus.lastTrainingTime = new Date();
    trainingStatus.totalExamples = await countTrainingExamples();
    trainingStatus.isTraining = false;
    
    console.log('RLHF training completed');
  } catch (error) {
    console.error('Error in RLHF training:', error);
    trainingStatus.isTraining = false;
  }
}

/**
 * Simulate training process (for demonstration)
 */
async function simulateTraining() {
  // In a real implementation, this would call Vertex AI APIs
  return new Promise(resolve => {
    setTimeout(resolve, 5000); // Simulate 5 seconds of training
  });
}

/**
 * Apply RLHF model to generate response
 * This would be called from aiService.js, replacing or enhancing the existing generateResponse function
 */
exports.generateImprovedResponse = async (email, category, retrievedInfo = '') => {
  // In a real implementation, this would use the fine-tuned model
  // For now, we'll call the regular generation function with some enhancements
  
  // This is a placeholder - in a real implementation, you would:
  // 1. Use the fine-tuned model instead of the base model
  // 2. Apply any special prompting techniques learned from RLHF
  
  try {
    const prompt = `
# Role:  
You are a professional email writer that has been trained on thousands of examples of high-quality customer support emails.
You've learned from human feedback what makes a great response.

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

    // Here you would call your fine-tuned model
    const generativeModel = vertexAI.preview.getGenerativeModel({
      model: trainingStatus.currentModel,
      generation_config: {
        max_output_tokens: 1024,
        temperature: 0.2  // Lower temperature for RLHF models typically works better
      }
    });

    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating improved response:', error);
    // Fall back to template-based response
    return generateTemplateResponse(email, category);
  }
};

// Helper function to generate a template-based response (fallback)
function generateTemplateResponse(email, category) {
  // This is the same template logic from aiService.js
  const nameMatch = email.from.match(/^([^<]+)/);
  const customerName = nameMatch ? nameMatch[1].trim() : "Customer";
  
  const templates = {
    product_inquiry: `Dear ${customerName},\n\nThank you for your interest...`,
    customer_complaint: `Dear ${customerName},\n\nI sincerely apologize...`,
    customer_feedback: `Dear ${customerName},\n\nThank you for your feedback...`,
    unrelated: `Dear ${customerName},\n\nThank you for your message...`
  };
  
  return templates[category] || templates.unrelated;
}