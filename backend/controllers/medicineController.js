const { validationResult } = require('express-validator');
const Medicine = require('../models/Medicine');
const fuzzySearchService = require('../services/fuzzySearchService');

// Get all medicines with filtering and pagination
exports.getAllMedicines = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      prescriptionRequired,
      search,
      manufacturer,
      inStock,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true, isDiscontinued: false };
    
    if (category) filter.category = category;
    if (prescriptionRequired !== undefined) filter.prescriptionRequired = prescriptionRequired === 'true';
    if (manufacturer) filter['manufacturer.name'] = new RegExp(manufacturer, 'i');
    if (inStock !== undefined) filter['availability.inStock'] = inStock === 'true';
    
    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { genericName: searchRegex },
        { brandName: searchRegex },
        { therapeuticClass: searchRegex }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const medicines = await Medicine.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .populate('updatedBy', 'firstName lastName')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalMedicines = await Medicine.countDocuments(filter);
    const totalPages = Math.ceil(totalMedicines / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMedicines,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get medicine by ID
exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findById(id)
      .populate('createdBy', 'firstName lastName role')
      .populate('updatedBy', 'firstName lastName');

    if (!medicine || !medicine.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { medicine }
    });

  } catch (error) {
    console.error('Get medicine by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new medicine (Admin/Doctor only)
exports.createMedicine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const medicineData = {
      ...req.body,
      createdBy: req.user._id
    };

    const medicine = new Medicine(medicineData);
    await medicine.save();

    // Populate creator info
    await medicine.populate('createdBy', 'firstName lastName role');

    res.status(201).json({
      success: true,
      message: 'Medicine created successfully',
      data: { medicine }
    });

  } catch (error) {
    console.error('Create medicine error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Medicine with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update medicine (Admin/Doctor only)
exports.updateMedicine = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('createdBy updatedBy', 'firstName lastName role');

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine updated successfully',
      data: { medicine }
    });

  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete medicine (soft delete - Admin only)
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        isDiscontinued: true,
        discontinuedDate: new Date(),
        discontinuedReason: req.body.reason || 'Deleted by admin',
        updatedBy: req.user._id
      },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Medicine deleted successfully'
    });

  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get medicines by category
exports.getMedicinesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.findByCategory(category)
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    const totalMedicines = await Medicine.countDocuments({ 
      category, 
      isActive: true, 
      isDiscontinued: false 
    });

    res.status(200).json({
      success: true,
      data: {
        medicines,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMedicines / parseInt(limit)),
          totalMedicines
        }
      }
    });

  } catch (error) {
    console.error('Get medicines by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search medicines with fuzzy matching
exports.searchMedicines = async (req, res) => {
  try {
    const { 
      query, 
      page = 1, 
      limit = 10, 
      minScore = 0.3,
      fuzzy = 'true' 
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    let results = [];
    let searchType = 'exact';

    if (fuzzy === 'true') {
      // Use fuzzy search
      const fuzzyResults = await fuzzySearchService.fuzzySearch(query, {
        maxResults: parseInt(limit),
        minScore: parseFloat(minScore),
        includeExact: true,
        includeFuzzy: true
      });

      results = fuzzyResults.map(result => ({
        ...result.medicine,
        searchScore: result.combinedScore,
        matchType: result.matchType,
        highlightedMatch: result.highlightedMatch
      }));
      
      searchType = 'fuzzy';
    } else {
      // Fallback to exact search
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const medicines = await Medicine.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { genericName: { $regex: query, $options: 'i' } }
        ],
        isActive: true,
        isDiscontinued: false
      })
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

      results = medicines.map(medicine => ({
        ...medicine.toObject(),
        searchScore: 1.0,
        matchType: 'regex',
        highlightedMatch: medicine.name
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        medicines: results,
        searchQuery: query,
        resultsCount: results.length,
        searchType,
        searchMetadata: {
          fuzzyEnabled: fuzzy === 'true',
          minScore: parseFloat(minScore),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get prescription medicines
exports.getPrescriptionMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.findPrescriptionMedicines()
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    const totalMedicines = await Medicine.countDocuments({ 
      prescriptionRequired: true, 
      isActive: true, 
      isDiscontinued: false 
    });

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMedicines / parseInt(limit)),
          totalMedicines
        }
      }
    });

  } catch (error) {
    console.error('Get prescription medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get OTC medicines
exports.getOTCMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const medicines = await Medicine.findOTCMedicines()
      .populate('createdBy', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit));

    const totalMedicines = await Medicine.countDocuments({ 
      prescriptionRequired: false, 
      isActive: true, 
      isDiscontinued: false 
    });

    res.status(200).json({
      success: true,
      data: {
        medicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMedicines / parseInt(limit)),
          totalMedicines
        }
      }
    });

  } catch (error) {
    console.error('Get OTC medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update medicine stock
exports.updateMedicineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, inStock } = req.body;

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { 
        'availability.quantity': quantity,
        'availability.inStock': inStock !== undefined ? inStock : quantity > 0,
        updatedBy: req.user._id
      },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        medicine: {
          _id: medicine._id,
          name: medicine.name,
          availability: medicine.availability,
          isLowStock: medicine.isLowStock
        }
      }
    });

  } catch (error) {
    console.error('Update medicine stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get low stock medicines
exports.getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.aggregate([
      {
        $match: {
          isActive: true,
          isDiscontinued: false,
          $expr: {
            $lte: ['$availability.quantity', '$availability.minimumStock']
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      {
        $unwind: '$createdBy'
      },
      {
        $project: {
          name: 1,
          genericName: 1,
          category: 1,
          availability: 1,
          'createdBy.firstName': 1,
          'createdBy.lastName': 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        medicines,
        count: medicines.length
      }
    });

  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Advanced fuzzy search with detailed results
exports.fuzzySearchMedicines = async (req, res) => {
  try {
    const { 
      query, 
      limit = 10,
      minScore = 0.3,
      includeScore = 'true',
      includeMatches = 'false'
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchResults = await fuzzySearchService.fuzzySearch(query, {
      maxResults: parseInt(limit),
      minScore: parseFloat(minScore),
      includeExact: true,
      includeFuzzy: true
    });

    // Format results for API response
    const formattedResults = searchResults.map(result => {
      const response = {
        medicine: result.medicine,
        matchType: result.matchType,
        highlightedMatch: result.highlightedMatch
      };

      if (includeScore === 'true') {
        response.scores = {
          combined: result.combinedScore,
          fuse: result.fuseScore,
          name: result.nameScore,
          generic: result.genericScore
        };
      }

      if (includeMatches === 'true') {
        response.matches = result.matches;
      }

      return response;
    });

    res.status(200).json({
      success: true,
      data: {
        results: formattedResults,
        searchQuery: query,
        resultsCount: formattedResults.length,
        searchMetadata: {
          minScore: parseFloat(minScore),
          algorithm: 'fuzzy',
          includeScore: includeScore === 'true',
          includeMatches: includeMatches === 'true'
        }
      }
    });

  } catch (error) {
    console.error('Fuzzy search medicines error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get medicine suggestions (autocomplete)
exports.getMedicineSuggestions = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    const suggestions = await fuzzySearchService.getSuggestions(query, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        query,
        count: suggestions.length
      }
    });

  } catch (error) {
    console.error('Get medicine suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Search medicines by category with fuzzy matching
exports.fuzzySearchByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { query = '', limit = 10 } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    const results = await fuzzySearchService.searchByCategory(
      category, 
      query, 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        medicines: results,
        category,
        query,
        resultsCount: results.length
      }
    });

  } catch (error) {
    console.error('Fuzzy search by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Find exact matches for validation
exports.findExactMedicineMatches = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }

    const exactMatches = await fuzzySearchService.findExactMatches(query);

    res.status(200).json({
      success: true,
      data: {
        matches: exactMatches,
        query,
        hasExactMatch: exactMatches.length > 0,
        matchCount: exactMatches.length
      }
    });

  } catch (error) {
    console.error('Find exact matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get search analytics
exports.getSearchAnalytics = async (req, res) => {
  try {
    const analytics = fuzzySearchService.getSearchAnalytics();

    res.status(200).json({
      success: true,
      data: {
        analytics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh search index
exports.refreshSearchIndex = async (req, res) => {
  try {
    await fuzzySearchService.forceRefreshIndex();

    res.status(200).json({
      success: true,
      message: 'Search index refreshed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Refresh search index error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh search index',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};