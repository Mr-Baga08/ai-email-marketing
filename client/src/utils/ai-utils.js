// utils/ai-utils.js
/**
 * Formats a prompt for AI-powered email generation
 * @param {Object} contactData - Contact data for personalization
 * @param {string} campaignPrompt - Campaign guidelines
 * @param {Array} scrapedData - Optional scraped data
 * @returns {string} - Formatted prompt
 */
export const formatEmailPrompt = (contactData, campaignPrompt, scrapedData = []) => {
    // Extract contact data for prompt
    const contactContext = Object.entries(contactData)
      .filter(([key]) => !key.includes('Description') && !key.includes('Notes'))
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  
    // Format scraped data
    const scrapedContext = scrapedData.length > 0
      ? `\nAdditional Information:\n${scrapedData.slice(0, 2).join('\n')}`
      : '';
  
    return `
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
  `;
  };
  
  /**
   * Extract relevant keywords from an email for knowledge base search
   * @param {string} emailText - The email text to analyze
   * @returns {string[]} - Array of keywords
   */
  export const extractKeywords = (emailText) => {
    if (!emailText) return [];
    
    // Simple keyword extraction (a more sophisticated version would use NLP)
    const words = emailText.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3) // Only words with more than 3 chars
      .filter(word => !commonWords.includes(word)); // Remove common words
      
    // Get unique keywords
    return [...new Set(words)];
  };
  
  // Common words to filter out
  const commonWords = [
    'the', 'and', 'that', 'have', 'this', 'with', 'from', 'your', 'which', 
    'will', 'would', 'there', 'their', 'what', 'about', 'when'
    // Add more common words as needed
  ];