const KnowledgeBase = require('../models/KnowledgeBase');
const aiService = require('../services/ai/aiService');

// @desc    Get all knowledge base entries
// @route   GET /api/knowledge-base
// @access  Private
exports.getKnowledgeBaseEntries = async (req, res) => {
  try {
    const entries = await KnowledgeBase.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Error fetching knowledge base entries:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Get knowledge base entry by ID
// @route   GET /api/knowledge-base/:id
// @access  Private
exports.getKnowledgeBaseEntryById = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error fetching knowledge base entry:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Create new knowledge base entry
// @route   POST /api/knowledge-base
// @access  Private
exports.createKnowledgeBaseEntry = async (req, res) => {
  try {
    const { content, category, tags } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // Generate embedding for content if AI service is available
    let embedding = [];
    try {
      const embeddingResult = await aiService.getEmbedding(content);
      if (embeddingResult.success) {
        embedding = embeddingResult.embedding;
      }
    } catch (err) {
      console.warn('Error generating embedding:', err);
      // Continue without embedding - we'll use keyword search as fallback
    }

    // Create knowledge base entry
    const entry = await KnowledgeBase.create({
      user: req.user.id,
      content,
      embedding,
      category: category || 'General',
      tags: tags || [],
      metadata: {
        source: 'manual',
        addedVia: 'api'
      }
    });

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Knowledge base entry created successfully'
    });
  } catch (error) {
    console.error('Error creating knowledge base entry:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Update knowledge base entry
// @route   PUT /api/knowledge-base/:id
// @access  Private
exports.updateKnowledgeBaseEntry = async (req, res) => {
  try {
    const { content, category, tags } = req.body;

    // Find entry by ID and user
    let entry = await KnowledgeBase.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // Only generate new embedding if content changed
    let embedding = entry.embedding;
    if (content && content !== entry.content) {
      try {
        const embeddingResult = await aiService.getEmbedding(content);
        if (embeddingResult.success) {
          embedding = embeddingResult.embedding;
        }
      } catch (err) {
        console.warn('Error generating updated embedding:', err);
        // Keep existing embedding or set to empty array if none exists
        embedding = entry.embedding || [];
      }
    }

    // Update entry
    entry = await KnowledgeBase.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        content: content || entry.content,
        embedding,
        category: category || entry.category,
        tags: tags || entry.tags,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: entry,
      message: 'Knowledge base entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating knowledge base entry:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Delete knowledge base entry
// @route   DELETE /api/knowledge-base/:id
// @access  Private
exports.deleteKnowledgeBaseEntry = async (req, res) => {
  try {
    const entry = await KnowledgeBase.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    await entry.remove();

    res.json({
      success: true,
      message: 'Knowledge base entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting knowledge base entry:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Bulk import knowledge base entries
// @route   POST /api/knowledge-base/bulk
// @access  Private
exports.bulkImportKnowledgeBase = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Entries array is required'
      });
    }

    const importResults = {
      total: entries.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process entries one by one to avoid timeout issues
    for (const entry of entries) {
      try {
        if (!entry.content) {
          importResults.failed++;
          importResults.errors.push(`Entry missing content: ${JSON.stringify(entry)}`);
          continue;
        }

        // Generate embedding
        let embedding = [];
        try {
          const embeddingResult = await aiService.getEmbedding(entry.content);
          if (embeddingResult.success) {
            embedding = embeddingResult.embedding;
          }
        } catch (err) {
          console.warn(`Error generating embedding for bulk entry: ${err.message}`);
        }

        // Create entry
        await KnowledgeBase.create({
          user: req.user.id,
          content: entry.content,
          embedding,
          category: entry.category || 'General',
          tags: entry.tags || [],
          metadata: {
            source: 'bulk-import',
            addedVia: 'api',
            originalData: entry
          }
        });

        importResults.successful++;
      } catch (entryError) {
        importResults.failed++;
        importResults.errors.push(`Error importing entry: ${entryError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      data: importResults,
      message: `Bulk import completed. Imported ${importResults.successful} of ${importResults.total} entries.`
    });
  } catch (error) {
    console.error('Error during bulk import:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Search knowledge base
// @route   GET /api/knowledge-base/search
// @access  Private
exports.searchKnowledgeBase = async (req, res) => {
  try {
    const { query, category } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let searchResults = [];

    // Try vector search first if embeddings are available
    try {
      const embeddingResult = await aiService.getEmbedding(query);
      
      if (embeddingResult.success && embeddingResult.embedding.length > 0) {
        // Search by vector similarity
        const filter = { user: req.user.id };
        if (category) filter.category = category;

        // Find entries with embeddings
        const entriesWithEmbeddings = await KnowledgeBase.find({
          ...filter,
          embedding: { $exists: true, $ne: [] }
        });

        // Calculate similarity scores
        if (entriesWithEmbeddings.length > 0) {
          searchResults = entriesWithEmbeddings.map(entry => {
            const similarity = computeCosineSimilarity(
              embeddingResult.embedding,
              entry.embedding
            );
            
            return {
              ...entry.toObject(),
              similarity
            };
          })
          .filter(entry => entry.similarity > 0.7) // Only include relevant results
          .sort((a, b) => b.similarity - a.similarity) // Sort by similarity
          .slice(0, 10); // Limit to top 10 results
        }
      }
    } catch (err) {
      console.warn('Error performing vector search:', err);
      // Fallback to keyword search
    }

    // If vector search didn't yield results, fall back to keyword search
    if (searchResults.length === 0) {
      const searchRegex = new RegExp(query, 'i');
      const filter = { 
        user: req.user.id,
        $or: [
          { content: searchRegex },
          { category: searchRegex },
          { tags: searchRegex }
        ]
      };
      
      if (category) filter.category = category;
      
      searchResults = await KnowledgeBase.find(filter)
        .sort({ createdAt: -1 })
        .limit(10);
    }

    res.json({
      success: true,
      count: searchResults.length,
      data: searchResults
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Get knowledge base categories
// @route   GET /api/knowledge-base/categories
// @access  Private
exports.getKnowledgeBaseCategories = async (req, res) => {
  try {
    // Aggregate unique categories
    const categories = await KnowledgeBase.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      count: categories.length,
      data: categories.map(cat => ({
        name: cat._id,
        count: cat.count
      }))
    });
  } catch (error) {
    console.error('Error fetching knowledge base categories:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// Helper function to compute cosine similarity between two vectors
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