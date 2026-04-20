const { validationResult } = require('express-validator');
const ReportSideEffect = require('../models/ReportSideEffect');
const Medication = require('../models/Medication');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const fuzzySearchService = require('../services/fuzzySearchService');
const { queueReportAnalysis } = require('../services/reportAnalysisProcessor');
const { sendSuccess, sendCreated, sendNotFound, sendForbidden, sendValidationError, sendError } = require('../utils/responseHelper');
const { validateObjectId } = require('../utils/validationHelper');
const { USER_ROLES, ERROR_MESSAGES } = require('../utils/constants');
const DuplicateDetectionService = require('../services/duplicateDetectionService');

// Submit a new side effect report
exports.submitReport = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    // Verify medication exists
    const medication = await Medication.findById(req.body.medicine);
    if (!medication) {
      return sendNotFound(res, ERROR_MESSAGES.MEDICATION_NOT_FOUND || 'Medication not found');
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
      status: 'Submitted',
      reportDetails: {
        ...req.body.reportDetails,
        reportDate: new Date()
      },
      metadata: {
        ...(req.body.metadata || {}),
        aiStatus: 'queued',
        aiLastQueuedAt: new Date()
      }
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

    const queueResult = await queueReportAnalysis(report._id, { reportSnapshot: report });

    // Notify staff if the report has serious/critical severity indicators
    setImmediate(async () => {
      try {
        const hasSeriousIndicators = report.sideEffects?.some(
          (e) => e.severity === 'Severe' || e.severity === 'Life-threatening'
        ) || report.reportDetails?.seriousness === 'Serious';

        if (hasSeriousIndicators) {
          await notificationService.notifyStaffUrgentReport(report, { trigger: 'submission' });
        }
      } catch (notifyError) {
        console.error('[Report Controller] Failed to send notifications:', notifyError);
      }
    });

    sendCreated(res, { 
      report,
      aiAnalysisStatus: 'queued',
      aiDelivery: queueResult.delivery
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
      severity,
      medicine,
      drugName,
      medicineQuery,
      reportedBy,
      patient,
      fromDate,
      toDate,
      sortBy = 'reportDetails.reportDate',
      sortOrder = 'desc'
    } = req.query;

    // Validate and parse pagination
    const { page, limit, skip } = validatePagination(req.query);

    const filter = await buildReportFilter({
      user: req.user,
      filters: {
        status,
        priority,
        seriousness,
        severity,
        medicine,
        drugName,
        medicineQuery,
        reportedBy,
        patient,
        fromDate,
        toDate
      }
    });

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
        { path: 'followUp.reportedBy', select: 'firstName lastName role' },
        { path: 'statusHistory.changedBy', select: 'firstName lastName role' }
      ]);

    if (!report || !report.isActive || report.isDeleted) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    // Check access permissions
    if (!canAccessReport(req.user, report)) {
      return sendForbidden(res, ERROR_MESSAGES.FORBIDDEN);
    }

    sendSuccess(res, { data: { report } });

  } catch (error) {
    console.error('Get report by ID error:', error);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch report', 500);
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

    // Notify patient of status change (non-blocking)
    setImmediate(async () => {
      try {
        await notificationService.notifyReportStatusUpdate(report, status);
      } catch (err) {
        console.error('[Report Controller] Failed to send status notification:', err);
      }
    });

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

    // Get medication info
    const medication = await Medication.findById(medicineId, 'name genericName category');
    const total = await ReportSideEffect.countDocuments(filter);

    const { sendPaginated } = require('../utils/responseHelper');
    sendPaginated(res, reports, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      meta: { medication }
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
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
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
      ]),
      
      // AI severity distribution (from AI analysis)
      ReportSideEffect.aggregate([
        { $match: { isActive: true, isDeleted: false, 'metadata.aiProcessed': true } },
        { $group: { _id: '$metadata.aiAnalysis.severity.level', count: { $sum: 1 } } }
      ]),
      
      // Patient-reported severity distribution (from sideEffects)
      ReportSideEffect.aggregate([
        { $match: { isActive: true, isDeleted: false } },
        { $unwind: '$sideEffects' },
        { $group: { _id: '$sideEffects.severity', count: { $sum: 1 } } }
      ]),
      
      // Reports this week
      ReportSideEffect.countDocuments({ 
        isActive: true, isDeleted: false, 
        createdAt: { $gte: weekAgo } 
      }),
      
      // AI processed count
      ReportSideEffect.countDocuments({ 
        isActive: true, isDeleted: false, 
        'metadata.aiProcessed': true 
      }),
      
      // Pending review requests
      ReportSideEffect.countDocuments({
        isActive: true, isDeleted: false,
        'doctorReview.requested': true,
        'doctorReview.status': { $in: ['pending', 'in_review'] }
      }),
      
      // Severe + Life-threatening (AI-detected OR patient-reported)
      ReportSideEffect.countDocuments({
        isActive: true, isDeleted: false,
        $or: [
          { 'metadata.aiAnalysis.severity.level': { $in: ['Severe', 'Life-threatening'] } },
          { 'sideEffects.severity': { $in: ['Severe', 'Life-threatening'] } }
        ]
      }),
      
      // High + Critical priority
      ReportSideEffect.countDocuments({
        isActive: true, isDeleted: false,
        priority: { $in: ['High', 'Critical'] }
      }),

      // Reports over last 30 days (grouped by day for trend chart)
      ReportSideEffect.aggregate([
        {
          $match: {
            isActive: true,
            isDeleted: false,
            createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    sendSuccess(res, {
      data: {
        totalReports: stats[0],
        seriousReports: stats[1],
        reportsByStatus: stats[2],
        reportsByPriority: stats[3],
        mostReportedMedicines: stats[4],
        aiSeverityDistribution: stats[5],
        patientSeverityDistribution: stats[6],
        reportsThisWeek: stats[7],
        aiProcessedCount: stats[8],
        pendingReviewCount: stats[9],
        severeCaseCount: stats[10],
        highPriorityCount: stats[11],
        reportsOverTime: stats[12]
      },
      message: 'Dashboard statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};

// Helper functions
function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveMedicationIdsFromQuery(searchTerm) {
  if (!searchTerm || String(searchTerm).trim().length === 0) {
    return [];
  }

  const trimmedQuery = String(searchTerm).trim();
  const regex = new RegExp(escapeRegex(trimmedQuery), 'i');

  const [regexMatches, fuzzyMatches] = await Promise.all([
    Medication.find({
      isActive: true,
      $or: [
        { name: regex },
        { genericName: regex },
        { tags: regex }
      ]
    })
      .select('_id')
      .limit(25)
      .lean(),
    fuzzySearchService.getSuggestions(trimmedQuery, 10).catch(() => [])
  ]);

  const medicationIds = new Set();

  regexMatches.forEach((match = {}) => medicationIds.add(String(match._id)));
  fuzzyMatches.forEach((match = {}) => {
    if (match.id) {
      medicationIds.add(String(match.id));
    }
  });

  return [...medicationIds];
}

async function buildReportFilter({ user, filters = {}, extraConditions = [] }) {
  const conditions = [{ isActive: true, isDeleted: false }, ...extraConditions];
  const {
    status,
    priority,
    seriousness,
    severity,
    medicine,
    drugName,
    medicineQuery,
    reportedBy,
    patient,
    fromDate,
    toDate
  } = filters;

  if (status) {
    conditions.push({ status });
  }

  if (priority) {
    conditions.push({ priority });
  }

  if (seriousness) {
    conditions.push({ 'reportDetails.seriousness': seriousness });
  }

  if (severity) {
    conditions.push({
      $or: [
        { 'doctorReview.doctorAssessment.severityOverride': severity },
        { 'metadata.aiAnalysis.severity.level': severity },
        { 'sideEffects.severity': severity }
      ]
    });
  }

  if (medicine) {
    conditions.push({ medicine });
  }

  const medicationSearch = medicineQuery || drugName;
  if (medicationSearch) {
    const medicationIds = await resolveMedicationIdsFromQuery(medicationSearch);
    conditions.push({ medicine: { $in: medicationIds } });
  }

  if (reportedBy) {
    conditions.push({ reportedBy });
  }

  if (patient) {
    conditions.push({ patient });
  }

  if (fromDate || toDate) {
    const incidentDate = {};

    if (fromDate) {
      incidentDate.$gte = new Date(fromDate);
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      incidentDate.$lte = endDate;
    }

    conditions.push({ 'reportDetails.incidentDate': incidentDate });
  }

  if (user.role === USER_ROLES.PATIENT) {
    conditions.push({
      $or: [
        { reportedBy: user._id },
        { patient: user._id }
      ]
    });
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
}

function canAccessReport(user, report) {
  // Admin can access all reports
  if (user.role === 'admin') return true;
  
  // Get the reportedBy ID (handle both populated and non-populated cases)
  const reportedById = report.reportedBy?._id?.toString() || report.reportedBy?.toString();
  const patientId = report.patient?._id?.toString() || report.patient?.toString();
  const assignedToId = report.assignedTo?._id?.toString() || report.assignedTo?.toString();
  const userId = user._id.toString();
  
  // User can access reports they submitted
  if (reportedById === userId) return true;
  
  // Patient can access reports about them
  if (user.role === 'patient' && patientId === userId) return true;
  
  // Doctor can access reports they're assigned to or submitted
  if (user.role === 'doctor' && assignedToId === userId) return true;
  
  // Doctors can access all reports for review purposes
  if (user.role === 'doctor') return true;
  
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

function normalizeDuplicateCandidate(candidate = {}) {
  return {
    ...candidate,
    similarityScore: candidate.similarityScore ?? candidate.score,
    score: candidate.score ?? candidate.similarityScore
  };
}

function normalizeDuplicatePayload(result = {}) {
  const duplicates = (result.duplicates || []).map(normalizeDuplicateCandidate);
  const hasPotentialDuplicates = Boolean(result.hasPotentialDuplicates ?? result.hasDuplicates);

  return {
    ...result,
    hasPotentialDuplicates,
    hasDuplicates: hasPotentialDuplicates,
    duplicateCount: result.duplicateCount ?? duplicates.length,
    duplicates
  };
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
    const payload = normalizeDuplicatePayload(result);
    
    sendSuccess(res, {
      data: payload,
      message: 'Duplicate analysis completed successfully'
    });
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
    const payload = normalizeDuplicatePayload(result);
    
    sendSuccess(res, {
      data: payload,
      message: payload.hasPotentialDuplicates
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
 * Merge a duplicate report into the original report
 * POST /api/reports/:id/merge-duplicate
 */
exports.mergeDuplicateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { originalReportId } = req.body;

    validateObjectId(id, 'Duplicate Report ID');
    validateObjectId(originalReportId, 'Original Report ID');

    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can merge duplicate reports');
    }

    const mergeResult = await DuplicateDetectionService.mergeDuplicateIntoOriginal(
      id,
      originalReportId,
      req.user._id
    );

    const { sendUpdated } = require('../utils/responseHelper');
    sendUpdated(res, mergeResult, 'Duplicate report merged successfully');
  } catch (error) {
    console.error('Merge duplicate report error:', error);

    if (error.message === 'Report not found') {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND);
    }

    if (
      error.message === 'A report cannot be merged into itself' ||
      error.message === 'Duplicate report is not active'
    ) {
      return sendError(res, error.message, 400);
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
    
    sendSuccess(res, {
      data: stats,
      message: 'Duplicate statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Get duplicate stats error:', error);
    throw error;
  }
};

/**
 * Request a doctor review for a report
 * POST /api/reports/:id/request-review
 * 
 * Allows patients to request a doctor's review of their side effect report
 */
exports.requestDoctorReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    validateObjectId(id, 'Report ID');

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND || 'Report not found');
    }

    // Only the patient who submitted or healthcare staff can request review
    if (req.user.role === USER_ROLES.PATIENT && 
        report.reportedBy.toString() !== req.user._id.toString()) {
      return sendForbidden(res, 'You can only request review for your own reports');
    }

    // Check if review already requested
    if (report.doctorReview?.requested) {
      return res.status(400).json({
        success: false,
        message: 'A doctor review has already been requested for this report'
      });
    }

    // Update the report with review request
    report.doctorReview = {
      requested: true,
      requestedAt: new Date(),
      requestedBy: req.user._id,
      requestReason: reason || 'Patient requested doctor review',
      status: 'pending'
    };

    await report.save();

    await report.populate([
      { path: 'reportedBy', select: 'firstName lastName' },
      { path: 'medicine', select: 'name genericName' }
    ]);

    sendSuccess(res, { data: { report }, message: 'Doctor review requested successfully' });
  } catch (error) {
    console.error('Request doctor review error:', error);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to request doctor review', 500);
  }
};

/**
 * Get reports pending doctor review
 * GET /api/reports/pending-reviews
 * 
 * For doctors to see reports that need their review
 */
exports.getPendingReviews = async (req, res) => {
  try {
    // Only doctors and admins can access pending reviews
    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can access pending reviews');
    }

    const { validatePagination } = require('../utils/validationHelper');
    const { page, limit, skip } = validatePagination(req.query);

    const filter = await buildReportFilter({
      user: req.user,
      filters: req.query,
      extraConditions: [
        {
          'doctorReview.requested': true,
          'doctorReview.status': { $in: ['pending', 'in_review'] }
        },
        ...(req.query.assignedToMe === 'true'
          ? [{ 'doctorReview.assignedDoctor': req.user._id }]
          : [])
      ]
    });

    const [reports, total] = await Promise.all([
      ReportSideEffect.find(filter)
        .populate('reportedBy', 'firstName lastName email')
        .populate('medicine', 'name genericName category')
        .populate('patient', 'firstName lastName')
        .populate('doctorReview.requestedBy', 'firstName lastName')
        .sort({ 'doctorReview.requestedAt': -1 })
        .skip(skip)
        .limit(limit),
      ReportSideEffect.countDocuments(filter)
    ]);

    sendSuccess(res, { 
      data: { reports },
      message: 'Pending reviews retrieved successfully',
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to fetch pending reviews', 500);
  }
};

/**
 * Requeue AI processing for a report
 * POST /api/reports/:id/reprocess-ai
 */
exports.reprocessAiAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    validateObjectId(id, 'Report ID');

    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can reprocess AI analysis');
    }

    const report = await ReportSideEffect.findById(id)
      .populate('reportedBy', 'firstName lastName role')
      .populate('medicine', 'name genericName category')
      .populate('patient', 'firstName lastName');

    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND || 'Report not found');
    }

    const queueResult = await queueReportAnalysis(report._id, {
      force: true,
      reportSnapshot: report
    });

    sendSuccess(res, {
      data: {
        reportId: report._id,
        aiAnalysisStatus: 'queued',
        aiDelivery: queueResult.delivery
      },
      message: 'AI analysis reprocessing queued successfully'
    });
  } catch (error) {
    console.error('Reprocess AI analysis error:', error);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to reprocess AI analysis', 500);
  }
};

/**
 * Submit doctor review/remarks for a report
 * POST /api/reports/:id/submit-review
 * 
 * Allows doctors to submit their review and remarks
 */
exports.submitDoctorReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      remarks, 
      agreedWithAI, 
      severityOverride, 
      recommendation, 
      actionRequired,
      followUpRequired,
      followUpDate,
      additionalNotes 
    } = req.body;
    
    validateObjectId(id, 'Report ID');

    // Only doctors and admins can submit reviews
    if (req.user.role === USER_ROLES.PATIENT) {
      return sendForbidden(res, 'Only healthcare staff can submit reviews');
    }

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND || 'Report not found');
    }

    // Update doctor review information
    report.doctorReview = {
      ...report.doctorReview,
      status: 'completed',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      remarks: remarks || '',
      doctorAssessment: {
        agreedWithAI: agreedWithAI !== undefined ? agreedWithAI : true,
        severityOverride: severityOverride || undefined,
        recommendation: recommendation || '',
        actionRequired: actionRequired || 'none',
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        additionalNotes: additionalNotes || ''
      }
    };

    // Update report status to reviewed
    report.status = 'Reviewed';

    await report.save();

    await report.populate([
      { path: 'reportedBy', select: 'firstName lastName' },
      { path: 'medicine', select: 'name genericName' },
      { path: 'patient', select: 'firstName lastName' },
      { path: 'doctorReview.reviewedBy', select: 'firstName lastName' }
    ]);

    // Notify patient that review is complete
    setImmediate(async () => {
      try {
        await notificationService.notifyReviewComplete(report);
      } catch (err) {
        console.error('[Report Controller] Failed to send review notification:', err);
      }
    });

    sendSuccess(res, { data: { report }, message: 'Doctor review submitted successfully' });
  } catch (error) {
    console.error('Submit doctor review error:', error);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to submit doctor review', 500);
  }
};

/**
 * Assign a report to a doctor for review
 * POST /api/reports/:id/assign-doctor
 * 
 * Allows admins to assign reports to specific doctors
 */
exports.assignToDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;
    
    validateObjectId(id, 'Report ID');
    validateObjectId(doctorId, 'Doctor ID');

    // Only admins can assign
    if (req.user.role !== USER_ROLES.ADMIN) {
      return sendForbidden(res, 'Only administrators can assign reports to doctors');
    }

    // Verify doctor exists and is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== USER_ROLES.DOCTOR) {
      return sendNotFound(res, 'Doctor not found');
    }

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return sendNotFound(res, ERROR_MESSAGES.REPORT_NOT_FOUND || 'Report not found');
    }

    // Update assignment
    report.doctorReview = {
      ...report.doctorReview,
      assignedDoctor: doctorId,
      assignedAt: new Date(),
      status: 'in_review'
    };

    await report.save();

    await report.populate([
      { path: 'doctorReview.assignedDoctor', select: 'firstName lastName email' }
    ]);

    sendSuccess(res, { data: { report }, message: 'Report assigned to doctor successfully' });
  } catch (error) {
    console.error('Assign to doctor error:', error);
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    return sendError(res, 'Failed to assign report to doctor', 500);
  }
};
