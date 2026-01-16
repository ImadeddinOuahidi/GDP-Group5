const express = require('express');
const { body, query } = require('express-validator');
const reportController = require('../controllers/reportController');
const aiReportController = require('../controllers/aiReportController');
const severityAnalysisController = require('../controllers/severityAnalysisController');
const { protect, restrictTo, requirePermission } = require('../middleware/auth');
const { uploadAIReportFiles, handleUploadErrors, validateUploadedFiles } = require('../middleware/fileUpload');

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

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all side effect reports with filtering
 *     description: Retrieve a paginated list of side effect reports with comprehensive filtering options
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reports per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Submitted, Under Review, Reviewed, Closed, Rejected]
 *         description: Filter by report status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *         description: Filter by priority level
 *       - in: query
 *         name: seriousness
 *         schema:
 *           type: string
 *           enum: [Serious, Non-serious]
 *         description: Filter by seriousness level
 *       - in: query
 *         name: medicine
 *         schema:
 *           type: string
 *         description: Filter by medicine ID
 *       - in: query
 *         name: reportedBy
 *         schema:
 *           type: string
 *         description: Filter by reporter user ID
 *       - in: query
 *         name: patient
 *         schema:
 *           type: string
 *         description: Filter by patient ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter reports until this date
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [reportDetails.reportDate, reportDetails.incidentDate, status, priority]
 *           default: reportDetails.reportDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 15
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                     total:
 *                       type: integer
 *                       example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportSideEffect'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard statistics (Admin/Doctor only)
 *     description: Retrieve comprehensive statistics for side effect reporting dashboard
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReports:
 *                       type: integer
 *                       example: 156
 *                     seriousReports:
 *                       type: integer
 *                       example: 23
 *                     pendingReviews:
 *                       type: integer
 *                       example: 12
 *                     reportsThisMonth:
 *                       type: integer
 *                       example: 28
 *                     topMedicines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           medicine:
 *                             type: string
 *                             example: "Paracetamol 500mg"
 *                           count:
 *                             type: integer
 *                             example: 15
 *                     severityBreakdown:
 *                       type: object
 *                       properties:
 *                         mild:
 *                           type: integer
 *                           example: 89
 *                         moderate:
 *                           type: integer
 *                           example: 45
 *                         severe:
 *                           type: integer
 *                           example: 18
 *                         lifeThreatening:
 *                           type: integer
 *                           example: 4
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/reports/dashboard - Get dashboard statistics (Admin/Doctor only)
router.get('/dashboard', 
  restrictTo('admin', 'doctor'),
  reportController.getDashboardStats
);

// ============================================
// DUPLICATE DETECTION ROUTES - Use Case 8
// ============================================

/**
 * @swagger
 * /api/reports/duplicate-stats:
 *   get:
 *     summary: Get duplicate detection statistics
 *     description: Retrieve statistics about duplicate report detection (Admin/Doctor only)
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved duplicate statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReports:
 *                       type: integer
 *                       example: 150
 *                     flaggedDuplicates:
 *                       type: integer
 *                       example: 12
 *                     recentDuplicatesLast7Days:
 *                       type: integer
 *                       example: 3
 *                     duplicateRate:
 *                       type: string
 *                       example: "8.00%"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/duplicate-stats', 
  restrictTo('admin', 'doctor'),
  reportController.getDuplicateStats
);

/**
 * @swagger
 * /api/reports/check-duplicates:
 *   post:
 *     summary: Check for duplicates before submission
 *     description: Pre-submission check to identify potential duplicate reports
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medicine:
 *                 type: string
 *                 description: Medicine ID
 *               patient:
 *                 type: string
 *                 description: Patient ID
 *               sideEffects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     effect:
 *                       type: string
 *     responses:
 *       200:
 *         description: Duplicate check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasPotentialDuplicates:
 *                   type: boolean
 *                 duplicateCount:
 *                   type: integer
 *                 duplicates:
 *                   type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/check-duplicates', reportController.checkDuplicatesBeforeSubmission);

/**
 * @swagger
 * /api/reports/serious:
 *   get:
 *     summary: Get serious side effect reports
 *     description: Retrieve all reports marked as serious adverse events
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved serious reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 23
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportSideEffect'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/reports/serious - Get serious reports
router.get('/serious', reportController.getSeriousReports);

/**
 * @swagger
 * /api/reports/medicine/{medicineId}:
 *   get:
 *     summary: Get reports by medicine
 *     description: Retrieve all side effect reports for a specific medicine
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicineId
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of reports per page
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [Mild, Moderate, Severe, Life-threatening]
 *         description: Filter by side effect severity
 *       - in: query
 *         name: seriousness
 *         schema:
 *           type: string
 *           enum: [Serious, Non-serious]
 *         description: Filter by report seriousness
 *     responses:
 *       200:
 *         description: Successfully retrieved reports for medicine
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 8
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReportSideEffect'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/reports/medicine/:medicineId - Get reports by medicine
router.get('/medicine/:medicineId', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('severity').optional().isIn(['Mild', 'Moderate', 'Severe', 'Life-threatening']),
  query('seriousness').optional().isIn(['Serious', 'Non-serious'])
], reportController.getReportsByMedicine);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get report by ID
 *     description: Retrieve detailed information about a specific side effect report
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully retrieved report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ReportSideEffect'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/reports/:id - Get report by ID
router.get('/:id', reportController.getReportById);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Submit new side effect report
 *     description: Create a new adverse event report with comprehensive medical details
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - medicine
 *               - sideEffects
 *               - medicationUsage
 *               - reportDetails
 *             properties:
 *               medicine:
 *                 type: string
 *                 description: Medicine ID causing the side effect
 *                 example: "507f1f77bcf86cd799439011"
 *               patient:
 *                 type: string
 *                 description: Patient ID (optional for anonymous reports)
 *                 example: "507f1f77bcf86cd799439012"
 *               sideEffects:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - effect
 *                     - severity
 *                     - onset
 *                   properties:
 *                     effect:
 *                       type: string
 *                       minLength: 2
 *                       maxLength: 200
 *                       example: "Severe nausea and vomiting"
 *                     severity:
 *                       type: string
 *                       enum: [Mild, Moderate, Severe, Life-threatening]
 *                       example: "Severe"
 *                     onset:
 *                       type: string
 *                       enum: [Immediate, Within hours, Within days, Within weeks, Unknown]
 *                       example: "Within hours"
 *                     bodySystem:
 *                       type: string
 *                       enum: [Gastrointestinal, Cardiovascular, Respiratory, Nervous System, Musculoskeletal, Dermatological, Genitourinary, Endocrine, Hematological, Psychiatric, Ocular, Otic, Other]
 *                       example: "Gastrointestinal"
 *               medicationUsage:
 *                 type: object
 *                 required:
 *                   - indication
 *                   - dosage
 *                   - startDate
 *                 properties:
 *                   indication:
 *                     type: string
 *                     example: "Pain management"
 *                   dosage:
 *                     type: object
 *                     required:
 *                       - amount
 *                       - frequency
 *                       - route
 *                     properties:
 *                       amount:
 *                         type: string
 *                         example: "500mg"
 *                       frequency:
 *                         type: string
 *                         example: "Twice daily"
 *                       route:
 *                         type: string
 *                         enum: [Oral, Intravenous, Intramuscular, Subcutaneous, Topical, Inhalation, Rectal, Vaginal, Nasal, Ophthalmic, Otic]
 *                         example: "Oral"
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-01T08:00:00.000Z"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-07T20:00:00.000Z"
 *               reportDetails:
 *                 type: object
 *                 required:
 *                   - incidentDate
 *                   - seriousness
 *                   - outcome
 *                 properties:
 *                   incidentDate:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-12-03T14:30:00.000Z"
 *                   seriousness:
 *                     type: string
 *                     enum: [Serious, Non-serious]
 *                     example: "Serious"
 *                   outcome:
 *                     type: string
 *                     enum: [Recovered/Resolved, Recovering, Not recovered, Recovered with sequelae, Fatal, Unknown]
 *                     example: "Recovering"
 *               patientInfo:
 *                 type: object
 *                 properties:
 *                   age:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 150
 *                     example: 45
 *                   gender:
 *                     type: string
 *                     enum: [male, female, other]
 *                     example: "female"
 *                   weight:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                         minimum: 0
 *                         example: 65.5
 *                       unit:
 *                         type: string
 *                         enum: [kg, lb]
 *                         example: "kg"
 *                   height:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: number
 *                         minimum: 0
 *                         example: 165
 *                       unit:
 *                         type: string
 *                         enum: [cm, in]
 *                         example: "cm"
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Side effect report submitted successfully
 *                 data:
 *                   $ref: '#/components/schemas/ReportSideEffect'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/reports - Submit new report
router.post('/', 
  submitReportValidation,
  reportController.submitReport
);

/**
 * @swagger
 * /api/reports/{id}/status:
 *   put:
 *     summary: Update report status (Doctor/Admin only)
 *     description: Update the workflow status of a side effect report
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Draft, Submitted, Under Review, Reviewed, Closed, Rejected]
 *                 example: "Under Review"
 *               assignedTo:
 *                 type: string
 *                 description: User ID to assign the report to
 *                 example: "507f1f77bcf86cd799439013"
 *               comments:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Report requires additional patient information"
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Report status updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "Under Review"
 *                     assignedTo:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439013"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-07T10:30:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// PUT /api/reports/:id/status - Update report status (Doctor/Admin only)
router.put('/:id/status', 
  restrictTo('admin', 'doctor'),
  updateStatusValidation,
  reportController.updateReportStatus
);

/**
 * @swagger
 * /api/reports/{id}/followup:
 *   post:
 *     summary: Add follow-up information to report
 *     description: Append additional information or corrections to an existing report
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - informationType
 *               - description
 *             properties:
 *               informationType:
 *                 type: string
 *                 enum: [Additional information, Correction, Follow-up report]
 *                 example: "Additional information"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "Patient recovered completely after discontinuing medication. No lasting effects observed."
 *     responses:
 *       200:
 *         description: Follow-up added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Follow-up information added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     followUp:
 *                       type: object
 *                       properties:
 *                         informationType:
 *                           type: string
 *                           example: "Additional information"
 *                         description:
 *                           type: string
 *                           example: "Patient recovered completely after discontinuing medication."
 *                         addedBy:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439014"
 *                         addedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-07T14:20:00.000Z"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/reports/:id/followup - Add follow-up information
router.post('/:id/followup', 
  followUpValidation,
  reportController.addFollowUp
);

// ============================================
// DUPLICATE DETECTION FOR SPECIFIC REPORT - Use Case 8
// ============================================

/**
 * @swagger
 * /api/reports/{id}/duplicates:
 *   get:
 *     summary: Find potential duplicate reports (Doctor/Admin only)
 *     description: Analyze a specific report to find potential duplicates. Implements Use Case 8 - Identify Duplicate Reports.
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID to check for duplicates
 *     responses:
 *       200:
 *         description: Duplicate analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     analysisDate:
 *                       type: string
 *                       format: date-time
 *                     totalCandidatesChecked:
 *                       type: integer
 *                     potentialDuplicatesFound:
 *                       type: integer
 *                     duplicates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reportId:
 *                             type: string
 *                           score:
 *                             type: number
 *                             description: Similarity score (0-1)
 *                           isPotentialDuplicate:
 *                             type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id/duplicates', 
  restrictTo('admin', 'doctor'),
  reportController.findDuplicates
);

/**
 * @swagger
 * /api/reports/{id}/flag-duplicate:
 *   post:
 *     summary: Flag report as duplicate (Doctor/Admin only)
 *     description: Confirm and flag a report as a duplicate of another report
 *     tags: [Duplicate Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID to flag as duplicate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalReportId
 *             properties:
 *               originalReportId:
 *                 type: string
 *                 description: ID of the original report this is a duplicate of
 *     responses:
 *       200:
 *         description: Report flagged as duplicate successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/:id/flag-duplicate', 
  restrictTo('admin', 'doctor'),
  reportController.flagAsDuplicate
);

/**
 * @swagger
 * /api/reports/{id}/causality:
 *   put:
 *     summary: Update causality assessment (Doctor/Admin only)
 *     description: Update the causality assessment of a side effect report using standardized algorithms
 *     tags: [Side Effect Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - algorithm
 *               - category
 *             properties:
 *               algorithm:
 *                 type: string
 *                 enum: [WHO-UMC, Naranjo, CIOMS/RUCAM, Other, Not assessed]
 *                 example: "WHO-UMC"
 *                 description: Causality assessment algorithm used
 *               score:
 *                 type: number
 *                 example: 7.5
 *                 description: Numerical score if applicable
 *               category:
 *                 type: string
 *                 enum: [Certain, Probable, Possible, Unlikely, Conditional, Unassessable, Unclassifiable]
 *                 example: "Probable"
 *                 description: Causality assessment category
 *               comments:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Clear temporal relationship established. Alternative causes ruled out. Positive dechallenge observed."
 *     responses:
 *       200:
 *         description: Causality assessment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Causality assessment updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     causalityAssessment:
 *                       type: object
 *                       properties:
 *                         algorithm:
 *                           type: string
 *                           example: "WHO-UMC"
 *                         score:
 *                           type: number
 *                           example: 7.5
 *                         category:
 *                           type: string
 *                           example: "Probable"
 *                         assessedBy:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439015"
 *                         assessedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-07T16:45:00.000Z"
 *                         comments:
 *                           type: string
 *                           example: "Clear temporal relationship established."
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// PUT /api/reports/:id/causality - Update causality assessment (Doctor/Admin only)
router.put('/:id/causality', 
  restrictTo('admin', 'doctor'),
  causalityAssessmentValidation,
  reportController.updateCausalityAssessment
);

// AI-Powered Report Submission Routes

/**
 * @swagger
 * /api/reports/aisubmit:
 *   post:
 *     summary: AI-powered side effect report submission
 *     description: Submit multimodal input (text, images, audio) to automatically extract and structure side effect report data using AI
 *     tags: [AI-Powered Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *                 example: "I took paracetamol 500mg twice daily for headache. After 2 days, I developed severe nausea and stomach pain. The pain started within a few hours of taking the medication."
 *                 description: Text description of the side effect experience
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Images showing visible side effects (rashes, swelling, etc.)
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio recording describing the side effect experience
 *               autoSubmit:
 *                 type: boolean
 *                 default: false
 *                 description: If true, automatically submit report when AI confidence is high
 *           encoding:
 *             images:
 *               contentType: image/jpeg, image/png, image/gif, image/webp
 *             audio:
 *               contentType: audio/mpeg, audio/wav, audio/m4a, audio/ogg, audio/webm
 *     responses:
 *       200:
 *         description: Multimodal input processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Multimodal input processed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedData:
 *                       type: object
 *                       properties:
 *                         medicine:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: "Paracetamol"
 *                             dosage:
 *                               type: string
 *                               example: "500mg"
 *                         sideEffects:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               effect:
 *                                 type: string
 *                                 example: "Severe nausea and stomach pain"
 *                               severity:
 *                                 type: string
 *                                 example: "Severe"
 *                               onset:
 *                                 type: string
 *                                 example: "Within hours"
 *                               bodySystem:
 *                                 type: string
 *                                 example: "Gastrointestinal"
 *                         confidence:
 *                           type: string
 *                           enum: [High, Medium, Low]
 *                           example: "High"
 *                     suggestedMedicines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           genericName:
 *                             type: string
 *                     foundMedicine:
 *                       $ref: '#/components/schemas/Medicine'
 *                     autoSubmittedReport:
 *                       $ref: '#/components/schemas/ReportSideEffect'
 *       400:
 *         description: Invalid input or file format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "At least one input (text, image, or audio) is required."
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: AI service rate limit reached
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "AI service rate limit reached. Please try again later."
 *                 code:
 *                   type: string
 *                   example: "AI_RATE_LIMIT"
 *       503:
 *         description: AI service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "AI service temporarily unavailable. Please try submitting a manual report."
 *                 code:
 *                   type: string
 *                   example: "AI_SERVICE_UNAVAILABLE"
 */
// POST /api/reports/aisubmit - AI-powered report submission
router.post('/aisubmit',
  uploadAIReportFiles,
  handleUploadErrors,
  validateUploadedFiles,
  aiReportController.submitAIReport
);

/**
 * @swagger
 * /api/reports/aipreview:
 *   post:
 *     summary: Preview AI-extracted report data
 *     description: Process multimodal input and preview extracted data without submitting the report
 *     tags: [AI-Powered Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 5000
 *                 example: "I experienced dizziness after taking my blood pressure medication this morning."
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *               audio:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Report data extracted successfully (preview mode)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Report data extracted successfully (preview mode)"
 *                 data:
 *                   type: object
 *                   properties:
 *                     extractedData:
 *                       type: object
 *                       description: "Structured data extracted from multimodal input"
 *                     suggestedMedicines:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Medicine'
 *                     isPreview:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/reports/aipreview - Preview AI-extracted data
router.post('/aipreview',
  uploadAIReportFiles,
  handleUploadErrors,
  validateUploadedFiles,
  aiReportController.previewAIReport
);

/**
 * @swagger
 * /api/reports/aiconfirm:
 *   post:
 *     summary: Submit confirmed AI-extracted report
 *     description: Submit a report using AI-extracted data that has been reviewed and confirmed by the user
 *     tags: [AI-Powered Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - extractedData
 *               - medicineId
 *             properties:
 *               extractedData:
 *                 type: object
 *                 description: "AI-extracted report data from previous preview"
 *               medicineId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: "Selected medicine ID from suggested medicines"
 *               modifications:
 *                 type: object
 *                 description: "User modifications to the extracted data"
 *                 properties:
 *                   sideEffects:
 *                     type: array
 *                     items:
 *                       type: object
 *                   patientInfo:
 *                     type: object
 *                   reportDetails:
 *                     type: object
 *     responses:
 *       201:
 *         description: AI-assisted report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "AI-assisted report submitted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/ReportSideEffect'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Medicine not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: "Medicine not found"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/reports/aiconfirm - Submit confirmed AI report
router.post('/aiconfirm',
  [
    body('extractedData').notEmpty().withMessage('Extracted data is required'),
    body('medicineId').isMongoId().withMessage('Valid medicine ID is required'),
    body('modifications').optional().isObject().withMessage('Modifications must be an object')
  ],
  aiReportController.submitConfirmedAIReport
);

// Severity Analysis Routes
router.post('/:id/analyze-severity', severityAnalysisController.analyzeSeverity);
router.get('/:id/severity-status', severityAnalysisController.getSeverityStatus);
router.post('/batch-analyze', severityAnalysisController.batchAnalyzeSeverity);
router.get('/analysis-stats', severityAnalysisController.getAnalysisStats);

module.exports = router;