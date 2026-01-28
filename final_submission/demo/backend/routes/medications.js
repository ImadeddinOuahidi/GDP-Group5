/**
 * Medication Routes
 * 
 * API endpoints for medication management:
 * - Public routes (authenticated): Search, categories, popular medications
 * - Patient routes: Create custom medications during reporting
 * - Doctor/Admin routes: Full CRUD, verification, statistics
 */

const express = require('express');
const { body, query, param } = require('express-validator');
const medicationController = require('../controllers/medicationController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== VALIDATION SCHEMAS ====================

const createMedicationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Medication name must be between 2 and 150 characters'),
  
  body('genericName')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Generic name cannot exceed 150 characters'),
  
  body('category')
    .optional()
    .isIn([
      'Analgesic', 'Antibiotic', 'Antiviral', 'Antifungal', 'Antihistamine',
      'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
      'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
      'Supplement', 'Other'
    ])
    .withMessage('Invalid medication category'),
  
  body('dosageForm')
    .optional()
    .isIn([
      'Tablet', 'Capsule', 'Liquid/Syrup', 'Injection', 'Cream/Ointment',
      'Drops', 'Inhaler', 'Patch', 'Powder', 'Other'
    ])
    .withMessage('Invalid dosage form'),
  
  body('commonStrengths')
    .optional()
    .isArray()
    .withMessage('Common strengths must be an array'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
];

const patientMedicationValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Medication name must be between 2 and 150 characters'),
  
  body('genericName')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Generic name cannot exceed 150 characters'),
  
  body('category')
    .optional()
    .isIn([
      'Analgesic', 'Antibiotic', 'Antiviral', 'Antifungal', 'Antihistamine',
      'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
      'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
      'Supplement', 'Other'
    ])
    .withMessage('Invalid medication category'),
  
  body('dosageForm')
    .optional()
    .isIn([
      'Tablet', 'Capsule', 'Liquid/Syrup', 'Injection', 'Cream/Ointment',
      'Drops', 'Inhaler', 'Patch', 'Powder', 'Other'
    ])
    .withMessage('Invalid dosage form')
];

const updateMedicationValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Medication name must be between 2 and 150 characters'),
  
  body('genericName')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Generic name cannot exceed 150 characters'),
  
  body('category')
    .optional()
    .isIn([
      'Analgesic', 'Antibiotic', 'Antiviral', 'Antifungal', 'Antihistamine',
      'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
      'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
      'Supplement', 'Other'
    ])
    .withMessage('Invalid medication category'),
  
  body('dosageForm')
    .optional()
    .isIn([
      'Tablet', 'Capsule', 'Liquid/Syrup', 'Injection', 'Cream/Ointment',
      'Drops', 'Inhaler', 'Patch', 'Powder', 'Other'
    ])
    .withMessage('Invalid dosage form'),
  
  body('commonStrengths')
    .optional()
    .isArray()
    .withMessage('Common strengths must be an array'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query too long'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid medication ID')
];

// ==================== PUBLIC ROUTES (Authenticated Users) ====================

/**
 * @route   GET /api/medications/search
 * @desc    Search medications by name, generic name, or tags
 * @access  Authenticated
 */
router.get('/search', searchValidation, medicationController.searchMedications);

/**
 * @route   GET /api/medications/popular
 * @desc    Get popular medications (most used)
 * @access  Authenticated
 */
router.get('/popular', medicationController.getPopularMedications);

/**
 * @route   GET /api/medications/categories
 * @desc    Get all medication categories with counts
 * @access  Authenticated
 */
router.get('/categories', medicationController.getCategories);

/**
 * @route   GET /api/medications/category/:category
 * @desc    Get medications by category
 * @access  Authenticated
 */
router.get('/category/:category', medicationController.getMedicationsByCategory);

// ==================== PATIENT ROUTES ====================

/**
 * @route   POST /api/medications/patient
 * @desc    Create a new medication (patient-created, needs verification)
 * @access  Patient
 */
router.post(
  '/patient',
  restrictTo('patient'),
  patientMedicationValidation,
  medicationController.createPatientMedication
);

// ==================== DOCTOR/ADMIN ROUTES ====================

/**
 * @route   GET /api/medications/stats
 * @desc    Get medication statistics for dashboard
 * @access  Doctor/Admin
 */
router.get(
  '/stats',
  restrictTo('doctor', 'admin'),
  medicationController.getMedicationStats
);

/**
 * @route   GET /api/medications/unverified
 * @desc    Get unverified patient-created medications
 * @access  Doctor/Admin
 */
router.get(
  '/unverified',
  restrictTo('doctor', 'admin'),
  medicationController.getUnverifiedMedications
);

/**
 * @route   PUT /api/medications/:id/verify
 * @desc    Verify a patient-created medication
 * @access  Doctor/Admin
 */
router.put(
  '/:id/verify',
  restrictTo('doctor', 'admin'),
  idValidation,
  medicationController.verifyMedication
);

/**
 * @route   GET /api/medications
 * @desc    Get all medications with filtering and pagination
 * @access  Doctor/Admin
 */
router.get(
  '/',
  restrictTo('doctor', 'admin'),
  medicationController.getAllMedications
);

/**
 * @route   POST /api/medications
 * @desc    Create a new medication (predefined)
 * @access  Doctor/Admin
 */
router.post(
  '/',
  restrictTo('doctor', 'admin'),
  createMedicationValidation,
  medicationController.createMedication
);

/**
 * @route   GET /api/medications/:id
 * @desc    Get medication by ID
 * @access  Authenticated
 */
router.get('/:id', idValidation, medicationController.getMedicationById);

/**
 * @route   PUT /api/medications/:id
 * @desc    Update a medication
 * @access  Doctor/Admin
 */
router.put(
  '/:id',
  restrictTo('doctor', 'admin'),
  idValidation,
  updateMedicationValidation,
  medicationController.updateMedication
);

/**
 * @route   DELETE /api/medications/:id
 * @desc    Delete a medication (soft delete)
 * @access  Doctor/Admin
 */
router.delete(
  '/:id',
  restrictTo('doctor', 'admin'),
  idValidation,
  medicationController.deleteMedication
);

module.exports = router;
