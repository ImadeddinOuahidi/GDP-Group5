/**
 * Symptom Progression Routes
 * Defines all API endpoints for symptom progression tracking functionality
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const symptomProgressionController = require('../controllers/symptomProgressionController');
const { protect: auth } = require('../middleware/auth');
const { requireRoles: roleAuth } = require('../middleware/roleAuth');

// Validation middleware
const validateProgressionCreation = [
  body('reportId')
    .notEmpty()
    .withMessage('Report ID is required')
    .isMongoId()
    .withMessage('Invalid report ID format'),
  body('sideEffectId')
    .notEmpty()
    .withMessage('Side effect ID is required')
    .isMongoId()
    .withMessage('Invalid side effect ID format'),
  body('patientId')
    .optional()
    .isMongoId()
    .withMessage('Invalid patient ID format'),
  body('initialImpact')
    .optional()
    .isObject()
    .withMessage('Initial impact must be an object'),
  body('initialImpact.daily_activities')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Daily activities impact must be between 0 and 10'),
  body('initialImpact.work_performance')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Work performance impact must be between 0 and 10'),
  body('initialImpact.sleep_quality')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Sleep quality impact must be between 0 and 10'),
  body('initialImpact.social_activities')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Social activities impact must be between 0 and 10'),
  body('initialImpact.mood')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Mood impact must be between 0 and 10'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const validateProgressionEntry = [
  body('severity')
    .notEmpty()
    .withMessage('Severity information is required')
    .isObject()
    .withMessage('Severity must be an object'),
  body('severity.level')
    .isIn(['None', 'Mild', 'Moderate', 'Severe', 'Life-threatening'])
    .withMessage('Invalid severity level'),
  body('severity.numericScore')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Numeric score must be between 0 and 10'),
  body('severity.description')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Severity description cannot exceed 300 characters'),
  body('frequency')
    .isIn(['Constant', 'Frequent', 'Occasional', 'Rare', 'Intermittent', 'Once'])
    .withMessage('Invalid frequency value'),
  body('pattern')
    .isIn(['Improving', 'Worsening', 'Stable', 'Fluctuating', 'Resolved'])
    .withMessage('Invalid pattern value'),
  body('functionalImpact')
    .optional()
    .isObject()
    .withMessage('Functional impact must be an object'),
  body('entryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('notes.patient_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Patient notes cannot exceed 1000 characters'),
  body('notes.clinician_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Clinician notes cannot exceed 1000 characters'),
  body('dataSource')
    .isIn(['Patient', 'Healthcare provider', 'Caregiver', 'Medical records', 'Device'])
    .withMessage('Invalid data source')
];

const validateStatusUpdate = [
  body('status')
    .isIn(['Active', 'Resolved', 'Chronic', 'Intermittent', 'Under investigation', 'Closed'])
    .withMessage('Invalid status value')
];

const validateAlertAcknowledgment = [
  body('alertIds')
    .isArray({ min: 1 })
    .withMessage('Alert IDs array is required with at least one ID'),
  body('alertIds.*')
    .isMongoId()
    .withMessage('Invalid alert ID format')
];

const validateReportGeneration = [
  body('type')
    .isIn(['patient', 'medicine'])
    .withMessage('Report type must be either "patient" or "medicine"'),
  body('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .isMongoId()
    .withMessage('Invalid entity ID format'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  body('includeAnalytics')
    .optional()
    .isBoolean()
    .withMessage('Include analytics must be a boolean')
];

const validateId = [
  param('progressionId')
    .isMongoId()
    .withMessage('Invalid progression ID format')
];

const validatePatientId = [
  param('patientId')
    .optional()
    .isMongoId()
    .withMessage('Invalid patient ID format')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     SymptomProgression:
 *       type: object
 *       required:
 *         - originalReport
 *         - patient
 *         - medicine
 *         - symptom
 *         - timeline
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the symptom progression
 *         originalReport:
 *           type: string
 *           description: Reference to the original side effect report
 *         patient:
 *           type: string
 *           description: Patient ID
 *         medicine:
 *           type: string
 *           description: Medicine ID
 *         symptom:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: Name of the symptom being tracked
 *             bodySystem:
 *               type: string
 *               enum: [Gastrointestinal, Cardiovascular, Respiratory, Nervous System, Musculoskeletal, Dermatological, Genitourinary, Endocrine, Hematological, Psychiatric, Ocular, Otic, Other]
 *         timeline:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *             isOngoing:
 *               type: boolean
 *         status:
 *           type: string
 *           enum: [Active, Resolved, Chronic, Intermittent, Under investigation, Closed]
 *         analytics:
 *           type: object
 *           properties:
 *             trendDirection:
 *               type: string
 *               enum: [Improving, Worsening, Stable, Fluctuating, Resolved, Unknown]
 *             averageSeverity:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 * 
 *     ProgressionEntry:
 *       type: object
 *       required:
 *         - severity
 *         - frequency
 *         - pattern
 *         - dataSource
 *       properties:
 *         entryDate:
 *           type: string
 *           format: date-time
 *         severity:
 *           type: object
 *           properties:
 *             level:
 *               type: string
 *               enum: [None, Mild, Moderate, Severe, Life-threatening]
 *             numericScore:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *             description:
 *               type: string
 *         frequency:
 *           type: string
 *           enum: [Constant, Frequent, Occasional, Rare, Intermittent, Once]
 *         pattern:
 *           type: string
 *           enum: [Improving, Worsening, Stable, Fluctuating, Resolved]
 *         functionalImpact:
 *           type: object
 *           properties:
 *             daily_activities:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *             work_performance:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *         dataSource:
 *           type: string
 *           enum: [Patient, Healthcare provider, Caregiver, Medical records, Device]
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   name: Symptom Progression
 *   description: Symptom progression tracking and analytics endpoints
 */

/**
 * @swagger
 * /api/symptom-progression/create:
 *   post:
 *     summary: Create symptom progression tracking from existing report
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportId
 *               - sideEffectId
 *             properties:
 *               reportId:
 *                 type: string
 *                 description: ID of the original side effect report
 *                 example: "507f1f77bcf86cd799439011"
 *               sideEffectId:
 *                 type: string
 *                 description: ID of the specific side effect to track
 *                 example: "507f1f77bcf86cd799439012"
 *               patientId:
 *                 type: string
 *                 description: Patient ID (required for healthcare providers)
 *                 example: "507f1f77bcf86cd799439013"
 *               initialImpact:
 *                 type: object
 *                 properties:
 *                   daily_activities:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 10
 *                     example: 5
 *                   work_performance:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 10
 *                     example: 3
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Patient wants to track nausea progression after medication"
 *     responses:
 *       201:
 *         description: Symptom progression tracking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Symptom progression tracking created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SymptomProgression'
 */
router.post('/create', 
  auth, 
  validateProgressionCreation, 
  symptomProgressionController.createProgressionFromReport
);

/**
 * @swagger
 * /api/symptom-progression/{progressionId}/entries:
 *   post:
 *     summary: Add new progression entry
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Symptom progression ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ProgressionEntry'
 *               - type: object
 *                 example:
 *                   severity:
 *                     level: "Moderate"
 *                     numericScore: 6
 *                     description: "Nausea is more pronounced today"
 *                   frequency: "Frequent"
 *                   pattern: "Worsening"
 *                   functionalImpact:
 *                     daily_activities: 7
 *                     work_performance: 8
 *                   notes:
 *                     patient_notes: "Felt sick after breakfast and lunch"
 *                   dataSource: "Patient"
 *     responses:
 *       200:
 *         description: Progression entry added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Progression entry added successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SymptomProgression'
 */
router.post('/:progressionId/entries', 
  auth, 
  validateId,
  validateProgressionEntry, 
  symptomProgressionController.addProgressionEntry
);

/**
 * @swagger
 * /api/symptom-progression/{progressionId}:
 *   get:
 *     summary: Get symptom progression by ID
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Symptom progression ID
 *     responses:
 *       200:
 *         description: Symptom progression retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SymptomProgression'
 */
router.get('/:progressionId', 
  auth, 
  validateId, 
  symptomProgressionController.getProgressionById
);

/**
 * @swagger
 * /api/symptom-progression/patient/{patientId}:
 *   get:
 *     summary: Get symptom progressions for a patient
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: false
 *         schema:
 *           type: string
 *         description: Patient ID (optional for patients accessing their own data)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Resolved, Chronic, Intermittent, Under investigation, Closed]
 *         description: Filter by status
 *       - in: query
 *         name: bodySystem
 *         schema:
 *           type: string
 *           enum: [Gastrointestinal, Cardiovascular, Respiratory, Nervous System, Musculoskeletal, Dermatological, Genitourinary, Endocrine, Hematological, Psychiatric, Ocular, Otic, Other]
 *         description: Filter by body system
 *     responses:
 *       200:
 *         description: Patient progressions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SymptomProgression'
 *                 count:
 *                   type: integer
 *                   example: 5
 */
router.get('/patient/:patientId?', 
  auth, 
  validatePatientId, 
  symptomProgressionController.getProgressionsByPatient
);

/**
 * @swagger
 * /api/symptom-progression/attention/needed:
 *   get:
 *     summary: Get progressions needing attention (Healthcare providers only)
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [None, Mild, Moderate, Severe, Life-threatening]
 *         description: Filter by severity level
 *       - in: query
 *         name: bodySystem
 *         schema:
 *           type: string
 *         description: Filter by body system
 *       - in: query
 *         name: minDuration
 *         schema:
 *           type: integer
 *         description: Minimum duration in days
 *     responses:
 *       200:
 *         description: Progressions needing attention retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SymptomProgression'
 *                 count:
 *                   type: integer
 *                   example: 12
 */
router.get('/attention/needed', 
  auth, 
  roleAuth(['doctor', 'admin', 'pharmacist']), 
  symptomProgressionController.getProgressionsNeedingAttention
);

/**
 * @swagger
 * /api/symptom-progression/{progressionId}/status:
 *   put:
 *     summary: Update symptom progression status
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Symptom progression ID
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
 *                 enum: [Active, Resolved, Chronic, Intermittent, Under investigation, Closed]
 *                 example: "Resolved"
 *     responses:
 *       200:
 *         description: Progression status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Progression status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SymptomProgression'
 */
router.put('/:progressionId/status', 
  auth, 
  validateId,
  validateStatusUpdate, 
  symptomProgressionController.updateProgressionStatus
);

/**
 * @swagger
 * /api/symptom-progression/{progressionId}/alerts/acknowledge:
 *   post:
 *     summary: Acknowledge alerts for a symptom progression
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Symptom progression ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alertIds
 *             properties:
 *               alertIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439022"]
 *                 description: Array of alert IDs to acknowledge
 *     responses:
 *       200:
 *         description: Alerts acknowledged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Alerts acknowledged successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SymptomProgression'
 */
router.post('/:progressionId/alerts/acknowledge', 
  auth, 
  validateId,
  validateAlertAcknowledgment, 
  symptomProgressionController.acknowledgeAlerts
);

/**
 * @swagger
 * /api/symptom-progression/search:
 *   get:
 *     summary: Search symptom progressions with advanced filters
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for symptom names and descriptions
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter by patient ID
 *       - in: query
 *         name: medicineId
 *         schema:
 *           type: string
 *         description: Filter by medicine ID
 *       - in: query
 *         name: bodySystem
 *         schema:
 *           type: string
 *         description: Filter by body system
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: timeline.startDate
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
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 progressions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SymptomProgression'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     pages:
 *                       type: integer
 *                       example: 8
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 */
router.get('/search', 
  auth, 
  symptomProgressionController.searchProgressions
);

/**
 * @swagger
 * /api/symptom-progression/analytics:
 *   get:
 *     summary: Get progression analytics (Healthcare providers only)
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: medicineId
 *         schema:
 *           type: string
 *         description: Filter analytics by medicine ID
 *       - in: query
 *         name: bodySystem
 *         schema:
 *           type: string
 *         description: Filter analytics by body system
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     basicStats:
 *                       type: object
 *                       properties:
 *                         totalProgressions:
 *                           type: integer
 *                           example: 1250
 *                         activeProgressions:
 *                           type: integer
 *                           example: 450
 *                         resolvedProgressions:
 *                           type: integer
 *                           example: 800
 *                         averageDuration:
 *                           type: number
 *                           example: 14.5
 *                         needingAttention:
 *                           type: integer
 *                           example: 35
 *                     trending:
 *                       type: array
 *                       description: Trending symptoms
 *                     severityDistribution:
 *                       type: array
 *                       description: Distribution by severity
 *                     durationPatterns:
 *                       type: object
 *                       description: Duration pattern analysis
 */
router.get('/analytics', 
  auth, 
  roleAuth(['doctor', 'admin', 'pharmacist']), 
  symptomProgressionController.getProgressionAnalytics
);

/**
 * @swagger
 * /api/symptom-progression/reports/generate:
 *   post:
 *     summary: Generate progression report (Healthcare providers only)
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - entityId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [patient, medicine]
 *                 example: "patient"
 *                 description: Type of report to generate
 *               entityId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: ID of patient or medicine
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *                 description: Start date for report data
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *                 description: End date for report data
 *               includeAnalytics:
 *                 type: boolean
 *                 default: true
 *                 description: Include analytics in the report
 *     responses:
 *       200:
 *         description: Progression report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Progression report generated successfully"
 *                 data:
 *                   type: object
 *                   description: Comprehensive progression report data
 */
router.post('/reports/generate', 
  auth, 
  roleAuth(['doctor', 'admin', 'pharmacist']),
  validateReportGeneration, 
  symptomProgressionController.generateProgressionReport
);

/**
 * @swagger
 * /api/symptom-progression/dashboard-analytics:
 *   get:
 *     summary: Get comprehensive dashboard analytics (Healthcare providers only)
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: medicineId
 *         schema:
 *           type: string
 *         description: Filter analytics by medicine ID
 *       - in: query
 *         name: bodySystem
 *         schema:
 *           type: string
 *         description: Filter analytics by body system
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Comprehensive dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       description: Overview statistics
 *                     severityTrends:
 *                       type: array
 *                       description: Severity trends over time
 *                     bodySystemAnalysis:
 *                       type: array
 *                       description: Analysis by body system
 *                     medicineImpactAnalysis:
 *                       type: array
 *                       description: Medicine impact analysis
 *                     resolutionPatterns:
 *                       type: object
 *                       description: Resolution pattern analysis
 *                     alerts:
 *                       type: object
 *                       description: Alert summary and analysis
 *                     timeSeries:
 *                       type: object
 *                       description: Time series data for charts
 */
router.get('/dashboard-analytics', 
  auth, 
  roleAuth(['doctor', 'admin', 'pharmacist']), 
  symptomProgressionController.getDashboardAnalytics
);

/**
 * @swagger
 * /api/symptom-progression/patient-analytics/{patientId}:
 *   get:
 *     summary: Get patient-specific analytics
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: false
 *         schema:
 *           type: string
 *         description: Patient ID (optional for patients accessing their own data)
 *     responses:
 *       200:
 *         description: Patient analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       description: Patient overview statistics
 *                     symptomHistory:
 *                       type: array
 *                       description: Patient's symptom history
 *                     medicineAnalysis:
 *                       type: array
 *                       description: Patient's medicine analysis
 *                     timeline:
 *                       type: array
 *                       description: Patient's progression timeline
 */
router.get('/patient-analytics/:patientId?', 
  auth, 
  symptomProgressionController.getPatientAnalytics
);

/**
 * @swagger
 * /api/symptom-progression/summary:
 *   get:
 *     summary: Get progression summary for dashboard
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *         description: Filter by patient ID (healthcare providers only)
 *       - in: query
 *         name: medicineId
 *         schema:
 *           type: string
 *         description: Filter by medicine ID
 *     responses:
 *       200:
 *         description: Summary data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     basicStats:
 *                       type: object
 *                       description: Basic progression statistics
 *                     recentTrends:
 *                       type: array
 *                       description: Recent trending symptoms
 *                     severityBreakdown:
 *                       type: array
 *                       description: Breakdown by severity
 *                     needsAttentionCount:
 *                       type: integer
 *                       example: 5
 */
router.get('/summary', 
  auth, 
  symptomProgressionController.getProgressionSummary
);

/**
 * @swagger
 * /api/symptom-progression/{progressionId}:
 *   delete:
 *     summary: Delete symptom progression
 *     tags: [Symptom Progression]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: progressionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Symptom progression ID
 *     responses:
 *       200:
 *         description: Symptom progression deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Symptom progression deleted successfully"
 */
router.delete('/:progressionId', 
  auth, 
  validateId, 
  symptomProgressionController.deleteProgression
);

module.exports = router;