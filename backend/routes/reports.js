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

module.exports = router;