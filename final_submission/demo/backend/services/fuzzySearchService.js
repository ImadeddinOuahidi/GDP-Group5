const Fuse = require('fuse.js');
const levenshtein = require('fast-levenshtein');
const natural = require('natural');
const Medication = require('../models/Medication');

class FuzzySearchService {
  constructor() {
    // Configure Fuse.js for medicine search
    this.fuseOptions = {
      // Fields to search in
      keys: [
        {
          name: 'name',
          weight: 0.7  // Primary medicine name gets highest weight
        },
        {
          name: 'genericName',
          weight: 0.6  // Generic name is very important
        },
        {
          name: 'manufacturer.name',
          weight: 0.2  // Manufacturer name has lower weight
        },
        {
          name: 'category',
          weight: 0.3  // Category matching
        },
        {
          name: 'therapeuticClass',
          weight: 0.25
        },
        {
          name: 'drugClass',
          weight: 0.25
        },
        {
          name: 'indications.condition',
          weight: 0.4  // What the medicine treats
        }
      ],
      // Search configuration
      includeScore: true,        // Include similarity scores
      includeMatches: true,      // Include match information
      threshold: 0.6,            // 0.0 = perfect match, 1.0 = match anything
      location: 0,               // Where in the text to start looking
      distance: 100,             // How far from location to search
      maxPatternLength: 32,      // Maximum pattern length
      minMatchCharLength: 2,     // Minimum character length for a match
      shouldSort: true,          // Sort results by score
      tokenize: true,            // Enable tokenization
      matchAllTokens: false,     // Don't require all tokens to match
      findAllMatches: true       // Find all matches, not just the first
    };

    this.medicineIndex = null;
    this.lastIndexUpdate = null;
    this.indexTTL = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Initialize or update the search index
   */
  async updateSearchIndex() {
    try {
      const now = Date.now();
      
      // Check if index needs updating
      if (this.medicineIndex && this.lastIndexUpdate && 
          (now - this.lastIndexUpdate) < this.indexTTL) {
        return; // Index is still fresh
      }

      console.log('Updating fuzzy search index...');
      
      // Fetch all active medications
      const medications = await Medication.find({}).lean();

      // Create search index
      this.medicineIndex = new Fuse(medications, this.fuseOptions);
      this.lastIndexUpdate = now;
      
      console.log(`Fuzzy search index updated with ${medications.length} medications`);
    } catch (error) {
      console.error('Error updating search index:', error);
      throw error;
    }
  }

  /**
   * Perform fuzzy search on medicine names
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Search results with similarity scores
   */
  async fuzzySearch(query, options = {}) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // Update index if needed
      await this.updateSearchIndex();

      if (!this.medicineIndex) {
        throw new Error('Search index not initialized');
      }

      const {
        maxResults = 10,
        minScore = 0.3,      // Minimum similarity score (0-1, higher = more similar)
        includeExact = true,  // Include exact matches
        includeFuzzy = true,  // Include fuzzy matches
        boostExactMatch = true // Give exact matches higher priority
      } = options;

      // Clean and prepare query
      const cleanQuery = this.cleanQuery(query);
      
      // Perform fuzzy search
      const fuzzyResults = this.medicineIndex.search(cleanQuery);
      
      // Process and enhance results
      let processedResults = await this.processSearchResults(
        fuzzyResults, 
        cleanQuery, 
        options
      );

      // Filter by minimum score
      processedResults = processedResults.filter(result => 
        result.combinedScore >= minScore
      );

      // Sort by combined score (highest first)
      processedResults.sort((a, b) => b.combinedScore - a.combinedScore);

      // Limit results
      return processedResults.slice(0, maxResults);

    } catch (error) {
      console.error('Fuzzy search error:', error);
      throw error;
    }
  }

  /**
   * Find medicine suggestions based on partial input
   * @param {string} partialName - Partial medicine name
   * @param {number} limit - Maximum suggestions to return
   * @returns {Array} Suggested medicines
   */
  async getSuggestions(partialName, limit = 5) {
    try {
      if (!partialName || partialName.length < 2) {
        return [];
      }

      // Use more lenient settings for suggestions
      const suggestions = await this.fuzzySearch(partialName, {
        maxResults: limit * 2,  // Get more results initially
        minScore: 0.2,          // Lower threshold for suggestions
        threshold: 0.8          // More permissive fuzzy matching
      });

      // Return simplified suggestion format
      return suggestions.slice(0, limit).map(result => ({
        id: result.medicine._id,
        name: result.medicine.name,
        genericName: result.medicine.genericName,
        score: result.combinedScore,
        matchType: result.matchType,
        highlightedName: result.highlightedMatch
      }));

    } catch (error) {
      console.error('Get suggestions error:', error);
      return [];
    }
  }

  /**
   * Process and enhance search results with additional scoring
   */
  async processSearchResults(fuzzyResults, originalQuery, options) {
    const results = [];

    for (const result of fuzzyResults) {
      const medicine = result.item;
      const fuseScore = 1 - result.score; // Invert Fuse score (higher is better)

      // Calculate additional similarity scores
      const nameScore = this.calculateStringSimilarity(
        originalQuery.toLowerCase(), 
        medicine.name.toLowerCase()
      );
      
      const genericScore = medicine.genericName ? this.calculateStringSimilarity(
        originalQuery.toLowerCase(), 
        medicine.genericName.toLowerCase()
      ) : 0;

      // Determine match type and calculate combined score
      const { matchType, combinedScore } = this.calculateCombinedScore({
        fuseScore,
        nameScore,
        genericScore,
        originalQuery: originalQuery.toLowerCase(),
        medicineName: medicine.name.toLowerCase(),
        genericName: medicine.genericName?.toLowerCase()
      });

      // Create highlighted match for display
      const highlightedMatch = this.createHighlightedMatch(result, originalQuery);

      results.push({
        medicine,
        fuseScore,
        nameScore,
        genericScore,
        combinedScore,
        matchType,
        highlightedMatch,
        matches: result.matches
      });
    }

    return results;
  }

  /**
   * Calculate string similarity using multiple algorithms
   */
  calculateStringSimilarity(str1, str2) {
    // Normalize strings
    str1 = str1.toLowerCase().trim();
    str2 = str2.toLowerCase().trim();

    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Calculate different similarity metrics
    const levenshteinDistance = levenshtein.get(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const levenshteinSimilarity = 1 - (levenshteinDistance / maxLength);

    // Jaro-Winkler similarity
    const jaroWinklerSimilarity = natural.JaroWinklerDistance(str1, str2);

    // N-gram similarity
    const ngramSimilarity = this.calculateNgramSimilarity(str1, str2, 2);

    // Weighted average of different similarity measures
    const weightedSimilarity = (
      levenshteinSimilarity * 0.4 +
      jaroWinklerSimilarity * 0.4 +
      ngramSimilarity * 0.2
    );

    return Math.max(0, Math.min(1, weightedSimilarity));
  }

  /**
   * Calculate N-gram similarity
   */
  calculateNgramSimilarity(str1, str2, n = 2) {
    const getNgrams = (str, n) => {
      const ngrams = [];
      for (let i = 0; i <= str.length - n; i++) {
        ngrams.push(str.substr(i, n));
      }
      return new Set(ngrams);
    };

    const ngrams1 = getNgrams(str1, n);
    const ngrams2 = getNgrams(str2, n);
    
    const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
    const union = new Set([...ngrams1, ...ngrams2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate combined score and determine match type
   */
  calculateCombinedScore({ fuseScore, nameScore, genericScore, originalQuery, medicineName, genericName }) {
    let matchType = 'fuzzy';
    let combinedScore = fuseScore;

    // Check for exact matches
    if (originalQuery === medicineName) {
      matchType = 'exact_name';
      combinedScore = 1.0;
    } else if (genericName && originalQuery === genericName) {
      matchType = 'exact_generic';
      combinedScore = 0.95;
    } else if (medicineName.includes(originalQuery)) {
      matchType = 'contains_name';
      combinedScore = Math.max(nameScore * 0.9, fuseScore);
    } else if (genericName && genericName.includes(originalQuery)) {
      matchType = 'contains_generic';
      combinedScore = Math.max(genericScore * 0.85, fuseScore);
    } else if (nameScore > 0.8) {
      matchType = 'high_similarity_name';
      combinedScore = Math.max(nameScore * 0.8, fuseScore);
    } else if (genericScore > 0.8) {
      matchType = 'high_similarity_generic';
      combinedScore = Math.max(genericScore * 0.75, fuseScore);
    }

    // Boost score for common prefixes
    if (medicineName.startsWith(originalQuery) || (genericName && genericName.startsWith(originalQuery))) {
      combinedScore = Math.min(1.0, combinedScore * 1.1);
      matchType = matchType.includes('exact') ? matchType : 'prefix_' + matchType;
    }

    return { matchType, combinedScore };
  }

  /**
   * Create highlighted match for display purposes
   */
  createHighlightedMatch(result, query) {
    if (!result.matches || result.matches.length === 0) {
      return result.item.name;
    }

    // Find the best match (highest weight)
    const bestMatch = result.matches.reduce((best, current) => {
      const currentKey = current.key;
      const bestKey = best.key;
      
      // Prioritize name matches
      if (currentKey === 'name' && bestKey !== 'name') return current;
      if (bestKey === 'name' && currentKey !== 'name') return best;
      
      // Then generic name
      if (currentKey === 'genericName' && bestKey !== 'genericName' && bestKey !== 'name') return current;
      
      return best;
    });

    let highlightedText = bestMatch.value || result.item.name;
    
    // Add simple highlighting (can be enhanced for frontend display)
    if (bestMatch.indices && bestMatch.indices.length > 0) {
      // This is a simplified version - frontend can use this data for proper highlighting
      const queryLower = query.toLowerCase();
      const textLower = highlightedText.toLowerCase();
      const index = textLower.indexOf(queryLower);
      
      if (index !== -1) {
        highlightedText = 
          highlightedText.substring(0, index) +
          '**' + highlightedText.substring(index, index + query.length) + '**' +
          highlightedText.substring(index + query.length);
      }
    }

    return highlightedText;
  }

  /**
   * Clean and normalize search query
   */
  cleanQuery(query) {
    return query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, ' ');    // Normalize whitespace
  }

  /**
   * Find exact medicine matches (for validation)
   */
  async findExactMatches(query) {
    try {
      await this.updateSearchIndex();
      
      const cleanQuery = this.cleanQuery(query);
      
      const exactMatches = await Medicine.find({
        $or: [
          { name: { $regex: new RegExp(`^${cleanQuery}$`, 'i') } },
          { genericName: { $regex: new RegExp(`^${cleanQuery}$`, 'i') } }
        ],
        isActive: true,
        isDiscontinued: false
      }).lean();

      return exactMatches;
    } catch (error) {
      console.error('Find exact matches error:', error);
      return [];
    }
  }

  /**
   * Search medicines by category with fuzzy matching
   */
  async searchByCategory(category, query = '', limit = 10) {
    try {
      await this.updateSearchIndex();

      // First filter by category
      const categoryMedicines = await Medicine.find({
        category: new RegExp(category, 'i'),
        isActive: true,
        isDiscontinued: false
      }).lean();

      if (!query || query.trim().length === 0) {
        return categoryMedicines.slice(0, limit);
      }

      // Create temporary index for this category
      const categoryIndex = new Fuse(categoryMedicines, this.fuseOptions);
      const results = categoryIndex.search(query);

      return results.slice(0, limit).map(result => result.item);
    } catch (error) {
      console.error('Search by category error:', error);
      throw error;
    }
  }

  /**
   * Get search analytics and insights
   */
  getSearchAnalytics() {
    return {
      indexSize: this.medicineIndex?.getIndex()?.docs?.length || 0,
      lastUpdate: this.lastIndexUpdate,
      cacheStatus: this.lastIndexUpdate && 
        (Date.now() - this.lastIndexUpdate) < this.indexTTL ? 'fresh' : 'stale',
      configuration: {
        threshold: this.fuseOptions.threshold,
        maxResults: 'configurable',
        minMatchLength: this.fuseOptions.minMatchCharLength
      }
    };
  }

  /**
   * Force refresh the search index
   */
  async forceRefreshIndex() {
    this.lastIndexUpdate = null;
    await this.updateSearchIndex();
  }
}

// Create singleton instance
const fuzzySearchService = new FuzzySearchService();

module.exports = fuzzySearchService;