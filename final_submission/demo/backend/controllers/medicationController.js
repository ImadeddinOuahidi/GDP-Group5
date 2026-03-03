/**
 * Medication Controller
 * 
 * Handles all medication-related operations:
 * - CRUD operations for medications
 * - Search functionality
 * - Category-based filtering
 * - Patient medication creation during side effect reporting
 * 
 * Design: Clean separation between doctor/admin operations and patient operations
 */

const { validationResult } = require('express-validator');
const Medication = require('../models/Medication');

/**
 * Response helper for consistent API responses
 */
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Error handler helper
 */
const handleError = (res, error, defaultMessage = 'An error occurred') => {
  console.error(`Medication Controller Error: ${error.message}`, error);
  
  // Handle MongoDB duplicate key error
  if (error.code === 11000) {
    return sendResponse(res, 400, false, 'A medication with this name already exists');
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return sendResponse(res, 400, false, messages.join('. '));
  }
  
  return sendResponse(res, 500, false, 
    process.env.NODE_ENV === 'development' ? error.message : defaultMessage
  );
};

// ==================== PUBLIC ENDPOINTS ====================

/**
 * @desc    Search medications
 * @route   GET /api/medications/search
 * @access  Public (Authenticated)
 * @query   q - search term, category, limit, verified
 */
exports.searchMedications = async (req, res) => {
  try {
    const { 
      q: searchTerm = '', 
      category, 
      limit = 20,
      verified = 'false' 
    } = req.query;
    
    if (!searchTerm || searchTerm.length < 1) {
      // Return popular medications if no search term
      const popular = await Medication.getPopular(parseInt(limit));
      return sendResponse(res, 200, true, 'Popular medications retrieved', {
        medications: popular,
        type: 'popular'
      });
    }
    
    const options = {
      limit: parseInt(limit),
      category: category || null,
      onlyVerified: verified === 'true',
      includePatientCreated: true
    };
    
    const medications = await Medication.search(searchTerm, options);
    
    return sendResponse(res, 200, true, 'Medications found', {
      medications,
      searchTerm,
      count: medications.length
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to search medications');
  }
};

/**
 * @desc    Get popular medications
 * @route   GET /api/medications/popular
 * @access  Public (Authenticated)
 */
exports.getPopularMedications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const medications = await Medication.getPopular(parseInt(limit));
    
    return sendResponse(res, 200, true, 'Popular medications retrieved', {
      medications
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get popular medications');
  }
};

/**
 * @desc    Get medications by category
 * @route   GET /api/medications/category/:category
 * @access  Public (Authenticated)
 */
exports.getMedicationsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;
    
    // Validate category
    if (!Medication.CATEGORIES.includes(category)) {
      return sendResponse(res, 400, false, 'Invalid category', {
        validCategories: Medication.CATEGORIES
      });
    }
    
    const medications = await Medication.getByCategory(category, parseInt(limit));
    
    return sendResponse(res, 200, true, 'Medications retrieved', {
      medications,
      category,
      count: medications.length
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get medications by category');
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/medications/categories
 * @access  Public (Authenticated)
 */
exports.getCategories = async (req, res) => {
  try {
    // Get categories with medication counts
    const categoryCounts = await Medication.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const categories = Medication.CATEGORIES.map(cat => {
      const found = categoryCounts.find(c => c._id === cat);
      return {
        name: cat,
        count: found ? found.count : 0
      };
    });
    
    return sendResponse(res, 200, true, 'Categories retrieved', {
      categories,
      dosageForms: Medication.DOSAGE_FORMS
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get categories');
  }
};

/**
 * @desc    Get medication by ID
 * @route   GET /api/medications/:id
 * @access  Public (Authenticated)
 */
exports.getMedicationById = async (req, res) => {
  try {
    const medication = await Medication.findOne({ 
      _id: req.params.id, 
      isActive: true 
    }).populate('createdBy', 'firstName lastName role');
    
    if (!medication) {
      return sendResponse(res, 404, false, 'Medication not found');
    }
    
    return sendResponse(res, 200, true, 'Medication retrieved', { medication });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get medication');
  }
};

// ==================== DOCTOR/ADMIN ENDPOINTS ====================

/**
 * @desc    Get all medications (with filtering for management)
 * @route   GET /api/medications
 * @access  Doctor/Admin
 */
exports.getAllMedications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      source,
      verified,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;
    
    // Build filter
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (source) filter.source = source;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { genericName: new RegExp(search, 'i') }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // Execute query
    const [medications, total] = await Promise.all([
      Medication.find(filter)
        .populate('createdBy', 'firstName lastName role')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Medication.countDocuments(filter)
    ]);
    
    const totalPages = Math.ceil(total / parseInt(limit));
    
    return sendResponse(res, 200, true, 'Medications retrieved', {
      medications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get medications');
  }
};

/**
 * @desc    Create a new medication (predefined by doctor/admin)
 * @route   POST /api/medications
 * @access  Doctor/Admin
 */
exports.createMedication = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', {
        errors: errors.array()
      });
    }
    
    const medicationData = {
      ...req.body,
      source: 'predefined',
      createdBy: req.user._id,
      creatorRole: req.user.role
    };
    
    const medication = new Medication(medicationData);
    await medication.save();
    
    // Populate creator info
    await medication.populate('createdBy', 'firstName lastName role');
    
    return sendResponse(res, 201, true, 'Medication created successfully', {
      medication
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to create medication');
  }
};

/**
 * @desc    Update a medication
 * @route   PUT /api/medications/:id
 * @access  Doctor/Admin
 */
exports.updateMedication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', {
        errors: errors.array()
      });
    }
    
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName role');
    
    if (!medication) {
      return sendResponse(res, 404, false, 'Medication not found');
    }
    
    return sendResponse(res, 200, true, 'Medication updated successfully', {
      medication
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to update medication');
  }
};

/**
 * @desc    Delete a medication (soft delete)
 * @route   DELETE /api/medications/:id
 * @access  Doctor/Admin
 */
exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!medication) {
      return sendResponse(res, 404, false, 'Medication not found');
    }
    
    return sendResponse(res, 200, true, 'Medication deleted successfully');
    
  } catch (error) {
    return handleError(res, error, 'Failed to delete medication');
  }
};

/**
 * @desc    Verify a patient-created medication
 * @route   PUT /api/medications/:id/verify
 * @access  Doctor/Admin
 */
exports.verifyMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    
    if (!medication) {
      return sendResponse(res, 404, false, 'Medication not found');
    }
    
    if (medication.isVerified) {
      return sendResponse(res, 400, false, 'Medication is already verified');
    }
    
    await medication.verify(req.user._id);
    await medication.populate('createdBy verifiedBy', 'firstName lastName role');
    
    return sendResponse(res, 200, true, 'Medication verified successfully', {
      medication
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to verify medication');
  }
};

/**
 * @desc    Get unverified medications (patient-created)
 * @route   GET /api/medications/unverified
 * @access  Doctor/Admin
 */
exports.getUnverifiedMedications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const filter = {
      isActive: true,
      isVerified: false,
      source: 'patient'
    };
    
    const [medications, total] = await Promise.all([
      Medication.find(filter)
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Medication.countDocuments(filter)
    ]);
    
    return sendResponse(res, 200, true, 'Unverified medications retrieved', {
      medications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get unverified medications');
  }
};

// ==================== PATIENT ENDPOINTS ====================

/**
 * @desc    Create a medication during side effect reporting (patient)
 * @route   POST /api/medications/patient
 * @access  Patient
 */
exports.createPatientMedication = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, 'Validation failed', {
        errors: errors.array()
      });
    }
    
    // Check if a similar medication already exists
    const existingMedication = await Medication.findOne({
      name: new RegExp(`^${req.body.name.trim()}$`, 'i'),
      isActive: true
    });
    
    if (existingMedication) {
      // Return the existing medication instead of creating a duplicate
      return sendResponse(res, 200, true, 'Similar medication found', {
        medication: existingMedication,
        isExisting: true
      });
    }
    
    const medicationData = {
      name: req.body.name,
      genericName: req.body.genericName || null,
      category: req.body.category || 'Other',
      dosageForm: req.body.dosageForm || null,
      description: req.body.description || null,
      source: 'patient',
      createdBy: req.user._id,
      creatorRole: 'patient',
      isVerified: false
    };
    
    const medication = new Medication(medicationData);
    await medication.save();
    
    return sendResponse(res, 201, true, 'Medication created successfully', {
      medication,
      isExisting: false,
      message: 'Your medication has been added and will be reviewed by a healthcare professional.'
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to create medication');
  }
};

/**
 * @desc    Get statistics for dashboard
 * @route   GET /api/medications/stats
 * @access  Doctor/Admin
 */
exports.getMedicationStats = async (req, res) => {
  try {
    const [
      totalMedications,
      predefinedCount,
      patientCreatedCount,
      unverifiedCount,
      categoryStats
    ] = await Promise.all([
      Medication.countDocuments({ isActive: true }),
      Medication.countDocuments({ isActive: true, source: 'predefined' }),
      Medication.countDocuments({ isActive: true, source: 'patient' }),
      Medication.countDocuments({ isActive: true, isVerified: false }),
      Medication.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    return sendResponse(res, 200, true, 'Statistics retrieved', {
      stats: {
        total: totalMedications,
        predefined: predefinedCount,
        patientCreated: patientCreatedCount,
        pendingVerification: unverifiedCount,
        byCategory: categoryStats
      }
    });
    
  } catch (error) {
    return handleError(res, error, 'Failed to get statistics');
  }
};
