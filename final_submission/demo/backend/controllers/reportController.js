const { validationResult } = require('express-validator');
const ReportSideEffect = require('../models/ReportSideEffect');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const SeverityAnalysisJob = require('../jobs/severityAnalysisJob');
const DuplicateDetectionService = require('../services/duplicateDetectionService');
const { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendValidationError } = require('../utils/responseHelper');
const { validateObjectId } = require('../utils/validationHelper');
const { USER_ROLES, SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const AppError = require('../utils/appError');

// Submit a new side effect report
exports.submitReport = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    // Verify medicine exists
    const medicine = await Medicine.findById(req.body.medicine);
    if (!medicine) {
      return sendNotFound(res, ERROR_MESSAGES.MEDICINE_NOT_FOUND);
    }

    // If patient is specified, verify they exist and are a patient
    if (req.body.patient) {
      const patient = await User.findById(req.body.patient);
      if (!patient || patient.role !== USER_ROLES.PATIENT) {
        return sendNotFound(res, 'Patient not found or invalid patient role');
      }
    }

    const reportData = {
      ...req.body,
      reportedBy: req.user._id,
      reporterRole: req.user.role,
      'reportDetails.reportDate': new Date()
    };

    // If no patient specified and reporter is patient, set patient to reporter
    if (!reportData.patient && req.user.role === USER_ROLES.PATIENT) {
      reportData.patient = req.user._id;
    }

    const report = new ReportSideEffect(reportData);
    await report.save();

    // Populate references
    await report.populate([
      { path: 'reportedBy', select: 'firstName lastName role' },
      { path: 'medicine', select: 'name genericName category' },
      { path: 'patient', select: 'firstName lastName' }
    ]);

    // Trigger AI severity analysis job asynchronously
    setImmediate(async () => {
      try {
        console.log(`[Report Controller] Triggering severity analysis for report: ${report._id}`);
        await SeverityAnalysisJob.processReport(report._id.toString());
      } catch (jobError) {
        console.error('[Report Controller] Background job error:', jobError);
      }
    });

    sendCreated(res, { 
      report,
      aiAnalysisStatus: 'processing'
    }, 'Side effect report submitted successfully');

  } catch (error) {
    console.error('Submit report error:', error);
    throw error;
  }
};

// Get all reports with filtering
exports.getAllReports = async (req, res) => {
  try {
    const { validatePagination } = require('../utils/validationHelper');
    
    const {
      status,
      priority,
      seriousness,
      medicine,
      reportedBy,
      patient,
      fromDate,
      toDate,
      sortBy = 'reportDetails.reportDate',
      sortOrder = 'desc'
    } = req.query;

    // Validate and parse pagination
    const { page, limit, skip } = validatePagination(req.query);

    // Build filter object
    const filter = { isActive: true, isDeleted: false };
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (seriousness) filter['reportDetails.seriousness'] = seriousness;
    if (medicine) filter.medicine = medicine;
    if (reportedBy) filter.reportedBy = reportedBy;
    if (patient) filter.patient = patient;

    // Date range filter
    if (fromDate || toDate) {
      filter['reportDetails.incidentDate'] = {};
      if (fromDate) filter['reportDetails.incidentDate'].$gte = new Date(fromDate);
      if (toDate) filter['reportDetails.incidentDate'].$lte = new Date(toDate);
    }

    // Role-based filtering
    if (req.user.role === 'patient') {
      // Patients can only see their own reports
      filter.$or = [
        { reportedBy: req.user._id },
        { patient: req.user._id }
      ];
    } else if (req.user.role === 'doctor') {
      // Doctors can see reports they submitted or for their patients
      if (!req.user.hasPermission || !req.user.hasPermission('view_all_reports')) {
        filter.$or = [
          { reportedBy: req.user._id },
          { patient: { $in: await getPatientIds(req.user._id) } }
        ];
      }
    }
    // Admins can see all reports (no additional filter)

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const reports = await ReportSideEffect.find(filter)
      .populate([
        { path: 'reportedBy', select: 'firstName lastName role' },
        { path: 'medicine', select: 'name genericName category manufacturer' },
        { path: 'patient', select: 'firstName lastName' },
        { path: 'assignedTo', select: 'firstName lastName role' }
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await ReportSideEffect.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const { sendPaginated } = require('../utils/responseHelper');
    sendPaginated(res, reports, {
      page,
      limit,
      total,
      totalPages
    });

  } catch (error) {
    console.error('Get all reports error:', error);
    throw error;
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'Report ID');

    const report = await ReportSideEffect.findById(id)
      .populate([
        { path: 'reportedBy', select: 'firstName lastName role email' },
        { path: 'medicine', select: 'name genericName category manufacturer dosageForm strength' },
        { path: 'patient', select: 'firstName lastName email dateOfBirth gender' },
        { path: 'assignedTo', select: 'firstName lastName role' },
        { path: 'causalityAssessment.assessedBy', select: 'firstName lastName role' },
        { path: 'followUp.reportedBy', select: 'firstName lastName role' }
      ]);

    if (!report || !report.isActive || report.isDeleted) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    // Check access permissions
    if (!canAccessReport(req.user, report)) {
      return sendForbidden(res, ERROR_MESSAGES.FORBIDDEN);
    }

    sendSuccess(res, { report });

  } catch (error) {
    console.error('Get report by ID error:', error);
    throw error;
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, comments } = req.body;
    
    validateObjectId(id, 'Report ID');

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    // Check permissions
    if (!canModifyReport(req.user, report)) {
      return sendForbidden(res, ERROR_MESSAGES.FORBIDDEN);
    }

    // Update report
    await report.updateStatus(status, req.user._id);
    
    if (assignedTo) {
      report.assignedTo = assignedTo;
    }

    // Add follow-up if comments provided
    if (comments) {
      await report.addFollowUp({
        informationType: 'Additional information',
        description: comments,
        reportedBy: req.user._id
      });
    }

    await report.populate([
      { path: 'assignedTo', select: 'firstName lastName role' },
      { path: 'lastModifiedBy', select: 'firstName lastName role' }
    ]);

    const { sendUpdated } = require('../utils/responseHelper');
    sendUpdated(res, { report }, 'Report status updated successfully');

  } catch (error) {
    console.error('Update report status error:', error);
    throw error;
  }
};

// Add follow-up to report
exports.addFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { informationType, description } = req.body;
    
    validateObjectId(id, 'Report ID');

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    // Check permissions
    if (!canAccessReport(req.user, report)) {
      return sendForbidden(res, ERROR_MESSAGES.FORBIDDEN);
    }

    await report.addFollowUp({
      informationType,
      description,
      reportedBy: req.user._id
    });

    await report.populate('followUp.reportedBy', 'firstName lastName role');

    sendSuccess(res, { 
      followUp: report.followUp[report.followUp.length - 1]
    }, 'Follow-up added successfully');

  } catch (error) {
    console.error('Add follow-up error:', error);
    throw error;
  }
};

// Update causality assessment
exports.updateCausalityAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { algorithm, score, category, comments } = req.body;

    validateObjectId(id, 'Report ID');

    // Only doctors and admins can perform causality assessment
    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'You do not have permission to perform causality assessment');
    }

    const report = await ReportSideEffect.findByIdAndUpdate(
      id,
      {
        'causalityAssessment.algorithm': algorithm,
        'causalityAssessment.score': score,
        'causalityAssessment.category': category,
        'causalityAssessment.comments': comments,
        'causalityAssessment.assessedBy': req.user._id,
        'causalityAssessment.assessmentDate': new Date(),
        lastModifiedBy: req.user._id,
        $inc: { version: 1 }
      },
      { new: true, runValidators: true }
    ).populate('causalityAssessment.assessedBy', 'firstName lastName role');

    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    sendSuccess(res, { 
      causalityAssessment: report.causalityAssessment
    }, 'Causality assessment updated successfully');

  } catch (error) {
    console.error('Update causality assessment error:', error);
    throw error;
  }
};

// Get reports by medicine
exports.getReportsByMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { severity, seriousness } = req.query;
    const { validatePagination } = require('../utils/validationHelper');
    
    validateObjectId(medicineId, 'Medicine ID');
    
    const { page, limit, skip } = validatePagination(req.query);

    // Build filter
    const filter = { medicine: medicineId, isActive: true, isDeleted: false };
    if (severity) filter['sideEffects.severity'] = severity;
    if (seriousness) filter['reportDetails.seriousness'] = seriousness;

    const reports = await ReportSideEffect.find(filter)
      .populate([
        { path: 'reportedBy', select: 'firstName lastName role' },
        { path: 'patient', select: 'firstName lastName' }
      ])
      .sort({ 'reportDetails.reportDate': -1 })
      .skip(skip)
      .limit(limit);

    // Get medicine info
    const medicine = await Medicine.findById(medicineId, 'name genericName category');
    const total = await ReportSideEffect.countDocuments(filter);

    const { sendPaginated } = require('../utils/responseHelper');
    sendPaginated(res, reports, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      meta: { medicine }
    });

  } catch (error) {
    console.error('Get reports by medicine error:', error);
    throw error;
  }
};

// Get serious reports
exports.getSeriousReports = async (req, res) => {
  try {
    const { validatePagination } = require('../utils/validationHelper');
    const { page, limit, skip } = validatePagination(req.query);

    const reports = await ReportSideEffect.findSeriousReports()
      .skip(skip)
      .limit(limit);

    const total = await ReportSideEffect.countDocuments({ 
      'reportDetails.seriousness': 'Serious',
      isActive: true,
      isDeleted: false
    });

    const { sendPaginated } = require('../utils/responseHelper');
    sendPaginated(res, reports, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Get serious reports error:', error);
    throw error;
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total reports
      ReportSideEffect.countDocuments({ isActive: true, isDeleted: false }),
      
      // Serious reports
      ReportSideEffect.countDocuments({ 
        'reportDetails.seriousness': 'Serious',
        isActive: true, 
        isDeleted: false 
      }),
      
      // Reports by status
      ReportSideEffect.aggregate([
        { $match: { isActive: true, isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Reports by priority
      ReportSideEffect.aggregate([
        { $match: { isActive: true, isDeleted: false } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      // Most reported medicines
      ReportSideEffect.aggregate([
        { $match: { isActive: true, isDeleted: false } },
        { $group: { _id: '$medicine', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'medicines',
            localField: '_id',
            foreignField: '_id',
            as: 'medicine'
          }
        },
        { $unwind: '$medicine' },
        {
          $project: {
            medicineName: '$medicine.name',
            medicineGeneric: '$medicine.genericName',
            reportCount: '$count'
          }
        }
      ])
    ]);

    sendSuccess(res, {
      totalReports: stats[0],
      seriousReports: stats[1],
      reportsByStatus: stats[2],
      reportsByPriority: stats[3],
      mostReportedMedicines: stats[4]
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};

// Helper functions
function canAccessReport(user, report) {
  // Admin can access all reports
  if (user.role === 'admin') return true;
  
  // User can access reports they submitted
  if (report.reportedBy.toString() === user._id.toString()) return true;
  
  // Patient can access reports about them
  if (user.role === 'patient' && report.patient && report.patient.toString() === user._id.toString()) return true;
  
  // Doctor can access reports they're assigned to or submitted
  if (user.role === 'doctor' && report.assignedTo && report.assignedTo.toString() === user._id.toString()) return true;
  
  return false;
}

function canModifyReport(user, report) {
  // Admin can modify all reports
  if (user.role === 'admin') return true;
  
  // Doctor can modify reports assigned to them
  if (user.role === 'doctor' && report.assignedTo && report.assignedTo.toString() === user._id.toString()) return true;
  
  // User can modify their own draft reports
  if (report.reportedBy.toString() === user._id.toString() && report.status === 'Draft') return true;
  
  return false;
}

async function getPatientIds(doctorId) {
  // This would typically get patient IDs for a specific doctor
  // Implementation depends on your appointment/patient management system
  return [];
}

// ============================================
// DUPLICATE DETECTION - Use Case 8 Implementation
// ============================================

/**
 * Find potential duplicate reports for a specific report
 * GET /api/reports/:id/duplicates
 * 
 * Implements Use Case 8: Identify Duplicate Reports
 * - Compares with stored reports
 * - Flags potential duplicates for staff review
 */
exports.findDuplicates = async (req, res) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'Report ID');

    // Only doctors and admins can check for duplicates
    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can access duplicate detection');
    }

    const result = await DuplicateDetectionService.findDuplicates(id);
    
    sendSuccess(res, result, 'Duplicate analysis completed successfully');
  } catch (error) {
    console.error('Find duplicates error:', error);
    if (error.message === 'Report not found') {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }
    throw error;
  }
};

/**
 * Check for duplicates before submitting a new report
 * POST /api/reports/check-duplicates
 * 
 * Pre-submission duplicate check to warn users
 */
exports.checkDuplicatesBeforeSubmission = async (req, res) => {
  try {
    const reportData = req.body;
    
    const result = await DuplicateDetectionService.checkForDuplicatesBeforeSubmission(reportData);
    
    sendSuccess(res, {
      ...result,
      message: result.hasPotentialDuplicates 
        ? 'Potential duplicate reports found. Please review before submitting.'
        : 'No duplicates detected.'
    });
  } catch (error) {
    console.error('Check duplicates before submission error:', error);
    throw error;
  }
};

/**
 * Flag a report as a confirmed duplicate
 * POST /api/reports/:id/flag-duplicate
 * 
 * Allows staff to confirm and flag duplicate reports
 */
exports.flagAsDuplicate = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalReportId } = req.body;
    
    validateObjectId(id, 'Report ID');
    validateObjectId(originalReportId, 'Original Report ID');

    // Only doctors and admins can flag duplicates
    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can flag duplicates');
    }

    // Verify original report exists
    const originalReport = await ReportSideEffect.findById(originalReportId);
    if (!originalReport) {
      return sendNotFound(res, 'Original report not found');
    }

    const report = await DuplicateDetectionService.flagAsDuplicate(
      id, 
      originalReportId, 
      req.user._id
    );

    await report.populate([
      { path: 'metadata.duplicateOf', select: 'reportDetails.reportDate medicine' },
      { path: 'metadata.duplicateFlaggedBy', select: 'firstName lastName' }
    ]);

    const { sendUpdated } = require('../utils/responseHelper');
    sendUpdated(res, { report }, 'Report flagged as duplicate successfully');
  } catch (error) {
    console.error('Flag as duplicate error:', error);
    if (error.message === 'Report not found') {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }
    throw error;
  }
};

/**
 * Get duplicate detection statistics
 * GET /api/reports/duplicate-stats
 * 
 * Provides analytics on duplicate detection
 */
exports.getDuplicateStats = async (req, res) => {
  try {
    // Only doctors and admins can access stats
    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can access duplicate statistics');
    }

    const stats = await DuplicateDetectionService.getDuplicateStats();
    
    sendSuccess(res, stats, 'Duplicate statistics retrieved successfully');
  } catch (error) {
    console.error('Get duplicate stats error:', error);
    throw error;
  }
};
}