const { validationResult } = require('express-validator');
const ReportSideEffect = require('../models/ReportSideEffect');
const Medicine = require('../models/Medicine');
const User = require('../models/User');

// Submit a new side effect report
exports.submitReport = async (req, res) => {
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

    // Verify medicine exists
    const medicine = await Medicine.findById(req.body.medicine);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // If patient is specified, verify they exist and are a patient
    if (req.body.patient) {
      const patient = await User.findById(req.body.patient);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({
          success: false,
          message: 'Patient not found or invalid patient role'
        });
      }
    }

    const reportData = {
      ...req.body,
      reportedBy: req.user._id,
      reporterRole: req.user.role,
      'reportDetails.reportDate': new Date()
    };

    // If no patient specified and reporter is patient, set patient to reporter
    if (!reportData.patient && req.user.role === 'patient') {
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

    res.status(201).json({
      success: true,
      message: 'Side effect report submitted successfully',
      data: { report }
    });

  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all reports with filtering
exports.getAllReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
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

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
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
      .limit(parseInt(limit));

    // Get total count
    const totalReports = await ReportSideEffect.countDocuments(filter);
    const totalPages = Math.ceil(totalReports / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReports,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check access permissions
    if (!canAccessReport(req.user, report)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this report'
      });
    }

    res.status(200).json({
      success: true,
      data: { report }
    });

  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, comments } = req.body;

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check permissions
    if (!canModifyReport(req.user, report)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this report'
      });
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

    res.status(200).json({
      success: true,
      message: 'Report status updated successfully',
      data: { report }
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add follow-up to report
exports.addFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { informationType, description } = req.body;

    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check permissions
    if (!canAccessReport(req.user, report)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add follow-up to this report'
      });
    }

    await report.addFollowUp({
      informationType,
      description,
      reportedBy: req.user._id
    });

    await report.populate('followUp.reportedBy', 'firstName lastName role');

    res.status(200).json({
      success: true,
      message: 'Follow-up added successfully',
      data: { 
        followUp: report.followUp[report.followUp.length - 1]
      }
    });

  } catch (error) {
    console.error('Add follow-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update causality assessment
exports.updateCausalityAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { algorithm, score, category, comments } = req.body;

    // Only doctors and admins can perform causality assessment
    if (req.user.role === 'patient') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform causality assessment'
      });
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
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Causality assessment updated successfully',
      data: { 
        causalityAssessment: report.causalityAssessment
      }
    });

  } catch (error) {
    console.error('Update causality assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get reports by medicine
exports.getReportsByMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { page = 1, limit = 10, severity, seriousness } = req.query;

    // Build filter
    const filter = { medicine: medicineId, isActive: true, isDeleted: false };
    if (severity) filter['sideEffects.severity'] = severity;
    if (seriousness) filter['reportDetails.seriousness'] = seriousness;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await ReportSideEffect.find(filter)
      .populate([
        { path: 'reportedBy', select: 'firstName lastName role' },
        { path: 'patient', select: 'firstName lastName' }
      ])
      .sort({ 'reportDetails.reportDate': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get medicine info
    const medicine = await Medicine.findById(medicineId, 'name genericName category');

    const totalReports = await ReportSideEffect.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        medicine,
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReports / parseInt(limit)),
          totalReports
        }
      }
    });

  } catch (error) {
    console.error('Get reports by medicine error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get serious reports
exports.getSeriousReports = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await ReportSideEffect.findSeriousReports()
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await ReportSideEffect.countDocuments({ 
      'reportDetails.seriousness': 'Serious',
      isActive: true,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReports / parseInt(limit)),
          totalReports
        }
      }
    });

  } catch (error) {
    console.error('Get serious reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    res.status(200).json({
      success: true,
      data: {
        totalReports: stats[0],
        seriousReports: stats[1],
        reportsByStatus: stats[2],
        reportsByPriority: stats[3],
        mostReportedMedicines: stats[4]
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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