const express = require('express');
const { body, query } = require('express-validator');
const medicineController = require('../controllers/medicineController');
const { protect, restrictTo, requirePermission } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Medicine validation schemas
const createMedicineValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medicine name must be between 2 and 100 characters'),
  
  body('genericName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Generic name must be between 2 and 100 characters'),
  
  body('manufacturer.name')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer name is required'),
  
  body('manufacturer.country')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer country is required'),
  
  body('manufacturer.licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('Manufacturer license number is required'),
  
  body('category')
    .isIn([
      'Antibiotic', 'Analgesic', 'Antiviral', 'Antifungal', 'Antihistamine',
      'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
      'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
      'Immunosuppressant', 'Vaccine', 'Vitamin', 'Supplement', 'Other'
    ])
    .withMessage('Invalid medicine category'),
  
  body('therapeuticClass')
    .trim()
    .notEmpty()
    .withMessage('Therapeutic class is required'),
  
  body('drugClass')
    .trim()
    .notEmpty()
    .withMessage('Drug class is required'),
  
  body('dosageForm')
    .isIn([
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
      'Drops', 'Inhaler', 'Patch', 'Suppository', 'Powder', 'Gel'
    ])
    .withMessage('Invalid dosage form'),
  
  body('strength.value')
    .isFloat({ min: 0 })
    .withMessage('Strength value must be a positive number'),
  
  body('strength.unit')
    .isIn(['mg', 'g', 'mcg', 'ml', 'L', 'IU', '%'])
    .withMessage('Invalid strength unit'),
  
  body('route')
    .isArray({ min: 1 })
    .withMessage('At least one route of administration is required'),
  
  body('route.*')
    .isIn([
      'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical',
      'Inhalation', 'Rectal', 'Vaginal', 'Nasal', 'Ophthalmic', 'Otic'
    ])
    .withMessage('Invalid route of administration'),
  
  body('prescriptionRequired')
    .isBoolean()
    .withMessage('Prescription requirement must be true or false'),
  
  body('indications')
    .optional()
    .isArray()
    .withMessage('Indications must be an array'),
  
  body('indications.*.condition')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Indication condition is required'),
  
  body('knownSideEffects')
    .optional()
    .isArray()
    .withMessage('Known side effects must be an array'),
  
  body('knownSideEffects.*.effect')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Side effect description is required'),
  
  body('knownSideEffects.*.severity')
    .optional()
    .isIn(['Mild', 'Moderate', 'Severe', 'Life-threatening'])
    .withMessage('Invalid side effect severity'),
  
  body('pricing.wholesalePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Wholesale price must be a positive number'),
  
  body('pricing.retailPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Retail price must be a positive number'),
  
  body('availability.quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer'),
  
  body('availability.minimumStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum stock must be a positive integer')
];

const updateMedicineValidation = [
  // Same as create but all fields optional
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Medicine name must be between 2 and 100 characters'),
  
  body('genericName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Generic name must be between 2 and 100 characters'),
  
  body('category')
    .optional()
    .isIn([
      'Antibiotic', 'Analgesic', 'Antiviral', 'Antifungal', 'Antihistamine',
      'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
      'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
      'Immunosuppressant', 'Vaccine', 'Vitamin', 'Supplement', 'Other'
    ])
    .withMessage('Invalid medicine category'),
  
  body('strength.value')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Strength value must be a positive number'),
  
  body('pricing.wholesalePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Wholesale price must be a positive number'),
  
  body('pricing.retailPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Retail price must be a positive number'),
  
  body('availability.quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer')
];

const stockUpdateValidation = [
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a positive integer'),
  
  body('inStock')
    .optional()
    .isBoolean()
    .withMessage('In stock must be true or false')
];

// Routes

// GET /api/medicines - Get all medicines with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim(),
  query('prescriptionRequired').optional().isBoolean(),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'genericName', 'category', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], medicineController.getAllMedicines);

// GET /api/medicines/search - Search medicines
router.get('/search', [
  query('query').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], medicineController.searchMedicines);

// GET /api/medicines/prescription - Get prescription medicines
router.get('/prescription', medicineController.getPrescriptionMedicines);

// GET /api/medicines/otc - Get over-the-counter medicines
router.get('/otc', medicineController.getOTCMedicines);

// GET /api/medicines/low-stock - Get low stock medicines (Admin/Doctor only)
router.get('/low-stock', 
  restrictTo('admin', 'doctor'), 
  medicineController.getLowStockMedicines
);

// GET /api/medicines/category/:category - Get medicines by category
router.get('/category/:category', medicineController.getMedicinesByCategory);

// GET /api/medicines/:id - Get medicine by ID
router.get('/:id', medicineController.getMedicineById);

// POST /api/medicines - Create new medicine (Admin/Doctor only)
router.post('/', 
  restrictTo('admin', 'doctor'),
  createMedicineValidation,
  medicineController.createMedicine
);

// PUT /api/medicines/:id - Update medicine (Admin/Doctor only)
router.put('/:id', 
  restrictTo('admin', 'doctor'),
  updateMedicineValidation,
  medicineController.updateMedicine
);

// PUT /api/medicines/:id/stock - Update medicine stock (Admin/Doctor only)
router.put('/:id/stock', 
  restrictTo('admin', 'doctor'),
  stockUpdateValidation,
  medicineController.updateMedicineStock
);

// DELETE /api/medicines/:id - Delete medicine (Admin only)
router.delete('/:id', 
  restrictTo('admin'),
  medicineController.deleteMedicine
);

module.exports = router;