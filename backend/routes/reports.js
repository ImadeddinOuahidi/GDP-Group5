const express = require('express');
const { body, query } = require('express-validator');
const reportController = require('../controllers/reportController');
const { protect, restrictTo, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Report validation schemas
const submitReportValidation = [
  body('medicine')
    .isMongoId()
    .withMessage('Valid medicine ID is required'),
  
  body('patient')
    .optional()
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  
  body('sideEffects')
    .isArray({ min: 1 })
    .withMessage('At least one side effect must be reported'),
  
  body('sideEffects.*.effect')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Side effect description must be between 2 and 200 characters'),
  
  body('sideEffects.*.severity')
    .isIn(['Mild', 'Moderate', 'Severe', 'Life-threatening'])
    .withMessage('Invalid severity level'),
  
  body('sideEffects.*.onset')
    .isIn(['Immediate', 'Within hours', 'Within days', 'Within weeks', 'Unknown'])
    .withMessage('Invalid onset time'),
  
  body('sideEffects.*.bodySystem')
    .optional()
    .isIn([
      'Gastrointestinal', 'Cardiovascular', 'Respiratory', 'Nervous System',
      'Musculoskeletal', 'Dermatological', 'Genitourinary', 'Endocrine',
      'Hematological', 'Psychiatric', 'Ocular', 'Otic', 'Other'
    ])
    .withMessage('Invalid body system'),
  
  body('medicationUsage.indication')
    .trim()
    .notEmpty()
    .withMessage('Indication is required'),
  
  body('medicationUsage.dosage.amount')
    .trim()
    .notEmpty()
    .withMessage('Dosage amount is required'),
  
  body('medicationUsage.dosage.frequency')
    .trim()
    .notEmpty()
    .withMessage('Dosage frequency is required'),
  
  body('medicationUsage.dosage.route')
    .isIn([
      'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical',
      'Inhalation', 'Rectal', 'Vaginal', 'Nasal', 'Ophthalmic', 'Otic'
    ])
    .withMessage('Invalid route of administration'),
  
  body('medicationUsage.startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('medicationUsage.endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  body('reportDetails.incidentDate')
    .isISO8601()
    .withMessage('Valid incident date is required'),
  
  body('reportDetails.seriousness')
    .isIn(['Serious', 'Non-serious'])
    .withMessage('Seriousness must be specified'),
  
  body('reportDetails.outcome')
    .isIn([
      'Recovered/Resolved', 'Recovering', 'Not recovered', 
      'Recovered with sequelae', 'Fatal', 'Unknown'
    ])
    .withMessage('Invalid outcome'),
  
  body('patientInfo.age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('patientInfo.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  
  body('patientInfo.weight.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  
  body('patientInfo.height.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Height must be a positive number')
];

const updateStatusValidation = [
  body('status')
    .isIn(['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Closed', 'Rejected'])
    .withMessage('Invalid status'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Valid assigned user ID is required'),
  
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments cannot exceed 500 characters')
];

const followUpValidation = [
  body('informationType')
    .isIn(['Additional information', 'Correction', 'Follow-up report'])
    .withMessage('Invalid information type'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters')
];

const causalityAssessmentValidation = [
  body('algorithm')
    .isIn(['WHO-UMC', 'Naranjo', 'CIOMS/RUCAM', 'Other', 'Not assessed'])
    .withMessage('Invalid algorithm'),
  
  body('score')
    .optional()
    .isFloat()
    .withMessage('Score must be a number'),
  
  body('category')
    .isIn([
      'Certain', 'Probable', 'Possible', 'Unlikely', 
      'Conditional', 'Unassessable', 'Unclassifiable'
    ])
    .withMessage('Invalid causality category'),
  
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comments cannot exceed 1000 characters')
];

// Routes

// GET /api/reports - Get all reports with filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Closed', 'Rejected']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  query('seriousness').optional().isIn(['Serious', 'Non-serious']),
  query('medicine').optional().isMongoId(),
  query('reportedBy').optional().isMongoId(),
  query('patient').optional().isMongoId(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('sortBy').optional().isIn(['reportDetails.reportDate', 'reportDetails.incidentDate', 'status', 'priority']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], reportController.getAllReports);

// GET /api/reports/dashboard - Get dashboard statistics (Admin/Doctor only)
router.get('/dashboard', 
  restrictTo('admin', 'doctor'),
  reportController.getDashboardStats
);

// GET /api/reports/serious - Get serious reports
router.get('/serious', reportController.getSeriousReports);

// GET /api/reports/medicine/:medicineId - Get reports by medicine
router.get('/medicine/:medicineId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('severity').optional().isIn(['Mild', 'Moderate', 'Severe', 'Life-threatening']),
  query('seriousness').optional().isIn(['Serious', 'Non-serious'])
], reportController.getReportsByMedicine);

// GET /api/reports/:id - Get report by ID
router.get('/:id', reportController.getReportById);

// POST /api/reports - Submit new report
router.post('/', 
  submitReportValidation,
  reportController.submitReport
);

// PUT /api/reports/:id/status - Update report status (Doctor/Admin only)
router.put('/:id/status', 
  restrictTo('admin', 'doctor'),
  updateStatusValidation,
  reportController.updateReportStatus
);

// POST /api/reports/:id/followup - Add follow-up information
router.post('/:id/followup', 
  followUpValidation,
  reportController.addFollowUp
);

// PUT /api/reports/:id/causality - Update causality assessment (Doctor/Admin only)
router.put('/:id/causality', 
  restrictTo('admin', 'doctor'),
  causalityAssessmentValidation,
  reportController.updateCausalityAssessment
);

module.exports = router;