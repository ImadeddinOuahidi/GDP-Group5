/**
 * Symptom Progression Controller
 * Handles all HTTP requests for symptom progression tracking functionality
 */

const { validationResult } = require('express-validator');
const symptomProgressionService = require('../services/symptomProgressionService');
const symptomProgressionAnalytics = require('../services/symptomProgressionAnalytics');
const ReportSideEffect = require('../models/ReportSideEffect');

/**
 * Create a new symptom progression from an existing side effect report
 */
const createProgressionFromReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { reportId, sideEffectId, initialImpact, notes } = req.body;
    const patientId = req.user.role === 'patient' ? req.user._id : req.body.patientId;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const reportData = { reportId };
    const symptomData = { 
      sideEffectId, 
      initialImpact, 
      notes 
    };

    const progression = await symptomProgressionService.createProgressionFromReport(
      reportData,
      symptomData,
      patientId
    );

    res.status(201).json({
      success: true,
      message: 'Symptom progression tracking created successfully',
      data: progression
    });

  } catch (error) {
    console.error('Create progression from report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create symptom progression tracking'
    });
  }
};

/**
 * Add a new progression entry to an existing symptom progression
 */
const addProgressionEntry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { progressionId } = req.params;
    const entryData = {
      ...req.body,
      enteredBy: req.user._id
    };

    const updatedProgression = await symptomProgressionService.addProgressionEntry(
      progressionId,
      entryData
    );

    res.json({
      success: true,
      message: 'Progression entry added successfully',
      data: updatedProgression
    });

  } catch (error) {
    console.error('Add progression entry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add progression entry'
    });
  }
};

/**
 * Get symptom progression by ID
 */
const getProgressionById = async (req, res) => {
  try {
    const { progressionId } = req.params;
    const progression = await symptomProgressionService.getProgressionById(progressionId);

    // Check access permissions
    const canAccess = await checkProgressionAccess(progression, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this symptom progression'
      });
    }

    res.json({
      success: true,
      data: progression
    });

  } catch (error) {
    console.error('Get progression by ID error:', error);
    
    if (error.message === 'Symptom progression not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve symptom progression'
    });
  }
};

/**
 * Get symptom progressions for a patient
 */
const getProgressionsByPatient = async (req, res) => {
  try {
    let patientId = req.params.patientId;
    
    // If no patientId provided and user is a patient, use their ID
    if (!patientId && req.user.role === 'patient') {
      patientId = req.user._id;
    }

    // Check access permissions
    const canAccess = await checkPatientAccess(patientId, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to patient progressions'
      });
    }

    const filters = {
      status: req.query.status,
      bodySystem: req.query.bodySystem
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const progressions = await symptomProgressionService.getProgressionsByPatient(
      patientId,
      filters
    );

    res.json({
      success: true,
      data: progressions,
      count: progressions.length
    });

  } catch (error) {
    console.error('Get progressions by patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient progressions'
    });
  }
};

/**
 * Get progressions needing attention
 */
const getProgressionsNeedingAttention = async (req, res) => {
  try {
    // Only healthcare providers and admins can access this endpoint
    if (!['doctor', 'admin', 'pharmacist'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Healthcare provider access required.'
      });
    }

    const filters = {
      severity: req.query.severity,
      bodySystem: req.query.bodySystem,
      duration: req.query.minDuration
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const progressions = await symptomProgressionService.getProgressionsNeedingAttention(filters);

    res.json({
      success: true,
      data: progressions,
      count: progressions.length
    });

  } catch (error) {
    console.error('Get progressions needing attention error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progressions needing attention'
    });
  }
};

/**
 * Update symptom progression status
 */
const updateProgressionStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { progressionId } = req.params;
    const { status } = req.body;

    // Get progression to check access
    const progression = await symptomProgressionService.getProgressionById(progressionId);
    const canModify = await checkProgressionModifyAccess(progression, req.user);
    
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to modify this progression'
      });
    }

    const updatedProgression = await symptomProgressionService.updateProgressionStatus(
      progressionId,
      status,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Progression status updated successfully',
      data: updatedProgression
    });

  } catch (error) {
    console.error('Update progression status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update progression status'
    });
  }
};

/**
 * Acknowledge alerts for a symptom progression
 */
const acknowledgeAlerts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { progressionId } = req.params;
    const { alertIds } = req.body;

    // Get progression to check access
    const progression = await symptomProgressionService.getProgressionById(progressionId);
    const canModify = await checkProgressionModifyAccess(progression, req.user);
    
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to modify this progression'
      });
    }

    const updatedProgression = await symptomProgressionService.acknowledgeAlerts(
      progressionId,
      alertIds,
      req.user._id
    );

    res.json({
      success: true,
      message: 'Alerts acknowledged successfully',
      data: updatedProgression
    });

  } catch (error) {
    console.error('Acknowledge alerts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to acknowledge alerts'
    });
  }
};

/**
 * Search symptom progressions with advanced filters
 */
const searchProgressions = async (req, res) => {
  try {
    // Build search parameters from query
    const searchParams = {
      query: req.query.q,
      patientId: req.query.patientId,
      medicineId: req.query.medicineId,
      bodySystem: req.query.bodySystem,
      severity: req.query.severity,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sortBy: req.query.sortBy || 'timeline.startDate',
      sortOrder: req.query.sortOrder || 'desc'
    };

    // If user is a patient, restrict search to their own progressions
    if (req.user.role === 'patient') {
      searchParams.patientId = req.user._id;
    }

    const result = await symptomProgressionService.searchProgressions(searchParams);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Search progressions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search progressions'
    });
  }
};

/**
 * Get progression analytics
 */
const getProgressionAnalytics = async (req, res) => {
  try {
    // Only healthcare providers and admins can access analytics
    if (!['doctor', 'admin', 'pharmacist'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Healthcare provider access required.'
      });
    }

    const filters = {};
    
    // Apply query filters
    if (req.query.medicineId) filters.medicine = req.query.medicineId;
    if (req.query.bodySystem) filters['symptom.bodySystem'] = req.query.bodySystem;
    if (req.query.startDate) {
      filters['timeline.startDate'] = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filters['timeline.startDate'] = { 
        ...filters['timeline.startDate'], 
        $lte: new Date(req.query.endDate) 
      };
    }

    const analytics = await symptomProgressionService.getProgressionAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get progression analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progression analytics'
    });
  }
};

/**
 * Generate progression report
 */
const generateProgressionReport = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Only healthcare providers and admins can generate reports
    if (!['doctor', 'admin', 'pharmacist'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Healthcare provider access required.'
      });
    }

    const reportParams = {
      type: req.body.type, // 'patient' or 'medicine'
      entityId: req.body.entityId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      includeAnalytics: req.body.includeAnalytics !== false
    };

    const report = await symptomProgressionService.generateProgressionReport(reportParams);

    res.json({
      success: true,
      message: 'Progression report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('Generate progression report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate progression report'
    });
  }
};

/**
 * Get progression summary for dashboard
 */
const getProgressionSummary = async (req, res) => {
  try {
    let filters = {};
    
    // If user is a patient, only show their progressions
    if (req.user.role === 'patient') {
      filters.patient = req.user._id;
    }
    
    // Apply additional filters for healthcare providers
    if (req.query.patientId && req.user.role !== 'patient') {
      filters.patient = req.query.patientId;
    }
    
    if (req.query.medicineId) {
      filters.medicine = req.query.medicineId;
    }

    const analytics = await symptomProgressionService.getProgressionAnalytics(filters);
    
    // Extract summary data
    const summary = {
      basicStats: analytics.basicStats,
      recentTrends: analytics.trending?.slice(0, 5) || [],
      severityBreakdown: analytics.severityDistribution || [],
      durationPatterns: analytics.durationPatterns || {},
      needsAttentionCount: analytics.basicStats?.needingAttention || 0
    };

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Get progression summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve progression summary'
    });
  }
};

/**
 * Get comprehensive dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    // Only healthcare providers and admins can access dashboard analytics
    if (!['doctor', 'admin', 'pharmacist'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Healthcare provider access required.'
      });
    }

    const filters = {};
    
    // Apply query filters
    if (req.query.medicineId) filters.medicine = req.query.medicineId;
    if (req.query.bodySystem) filters['symptom.bodySystem'] = req.query.bodySystem;
    if (req.query.startDate) {
      filters['timeline.startDate'] = { $gte: new Date(req.query.startDate) };
    }
    if (req.query.endDate) {
      filters['timeline.startDate'] = { 
        ...filters['timeline.startDate'], 
        $lte: new Date(req.query.endDate) 
      };
    }

    const analytics = await symptomProgressionAnalytics.generateDashboardAnalytics(filters);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics'
    });
  }
};

/**
 * Get patient-specific analytics
 */
const getPatientAnalytics = async (req, res) => {
  try {
    let patientId = req.params.patientId;
    
    // If no patientId provided and user is a patient, use their ID
    if (!patientId && req.user.role === 'patient') {
      patientId = req.user._id;
    }

    // Check access permissions
    const canAccess = await checkPatientAccess(patientId, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to patient analytics'
      });
    }

    const analytics = await symptomProgressionAnalytics.generatePatientAnalytics(patientId);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get patient analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient analytics'
    });
  }
};

/**
 * Delete/deactivate a symptom progression
 */
const deleteProgression = async (req, res) => {
  try {
    const { progressionId } = req.params;
    
    // Get progression to check access
    const progression = await symptomProgressionService.getProgressionById(progressionId);
    const canDelete = await checkProgressionDeleteAccess(progression, req.user);
    
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to delete this progression'
      });
    }

    // Soft delete by setting isDeleted flag
    const SymptomProgression = require('../models/SymptomProgression');
    await SymptomProgression.findByIdAndUpdate(progressionId, {
      isDeleted: true,
      isActive: false,
      deletedAt: new Date(),
      deletedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'Symptom progression deleted successfully'
    });

  } catch (error) {
    console.error('Delete progression error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete progression'
    });
  }
};

// Helper functions for access control

/**
 * Check if user can access a specific progression
 */
async function checkProgressionAccess(progression, user) {
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Healthcare providers can access progressions of their patients
  if (['doctor', 'pharmacist'].includes(user.role)) {
    // Could add additional checks here for provider-patient relationships
    return true;
  }
  
  // Patients can only access their own progressions
  if (user.role === 'patient') {
    return progression.patient._id.toString() === user._id.toString();
  }
  
  return false;
}

/**
 * Check if user can access progressions for a specific patient
 */
async function checkPatientAccess(patientId, user) {
  // Admin can access everything
  if (user.role === 'admin') return true;
  
  // Healthcare providers can access patient data
  if (['doctor', 'pharmacist'].includes(user.role)) {
    return true;
  }
  
  // Patients can only access their own data
  if (user.role === 'patient') {
    return patientId === user._id.toString();
  }
  
  return false;
}

/**
 * Check if user can modify a progression
 */
async function checkProgressionModifyAccess(progression, user) {
  // Admin and healthcare providers can modify
  if (['admin', 'doctor', 'pharmacist'].includes(user.role)) {
    return true;
  }
  
  // Patients can modify their own progressions (limited modifications)
  if (user.role === 'patient') {
    return progression.patient._id.toString() === user._id.toString();
  }
  
  return false;
}

/**
 * Check if user can delete a progression
 */
async function checkProgressionDeleteAccess(progression, user) {
  // Only admin and the patient themselves can delete
  if (user.role === 'admin') return true;
  
  if (user.role === 'patient') {
    return progression.patient._id.toString() === user._id.toString();
  }
  
  // Healthcare providers cannot delete progressions
  return false;
}

module.exports = {
  createProgressionFromReport,
  addProgressionEntry,
  getProgressionById,
  getProgressionsByPatient,
  getProgressionsNeedingAttention,
  updateProgressionStatus,
  acknowledgeAlerts,
  searchProgressions,
  getProgressionAnalytics,
  generateProgressionReport,
  getProgressionSummary,
  getDashboardAnalytics,
  getPatientAnalytics,
  deleteProgression
};