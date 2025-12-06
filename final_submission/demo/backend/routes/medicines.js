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

/**
 * @swagger
 * /api/medicines:
 *   get:
 *     summary: Get all medicines with filtering and pagination
 *     description: Retrieve a paginated list of medicines with optional filtering by category, prescription requirement, and search query
 *     tags: [Medicines]
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
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Antibiotic, Analgesic, Antiviral, Antifungal, Antihistamine, Cardiovascular, Diabetes, Respiratory, Gastrointestinal, Neurological, Psychiatric, Dermatological, Hormonal, Immunosuppressant, Vaccine, Vitamin, Supplement, Other]
 *         description: Filter by medicine category
 *       - in: query
 *         name: prescriptionRequired
 *         schema:
 *           type: boolean
 *         description: Filter by prescription requirement
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in medicine name and generic name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, genericName, category, createdAt]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved medicines
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
 *                   example: 25
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
 *                       example: 3
 *                     total:
 *                       type: integer
 *                       example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

/**
 * @swagger
 * /api/medicines/search:
 *   get:
 *     summary: Search medicines by name or generic name
 *     description: Perform a text search across medicine names and generic names
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search query for medicine names
 *         example: "paracetamol"
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search results found
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
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/search - Search medicines
router.get('/search', [
  query('query').notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], medicineController.searchMedicines);

/**
 * @swagger
 * /api/medicines/prescription:
 *   get:
 *     summary: Get prescription medicines only
 *     description: Retrieve medicines that require a prescription
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved prescription medicines
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/prescription - Get prescription medicines
router.get('/prescription', medicineController.getPrescriptionMedicines);

/**
 * @swagger
 * /api/medicines/otc:
 *   get:
 *     summary: Get over-the-counter medicines
 *     description: Retrieve medicines that do not require a prescription
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved OTC medicines
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
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/otc - Get over-the-counter medicines
router.get('/otc', medicineController.getOTCMedicines);

/**
 * @swagger
 * /api/medicines/low-stock:
 *   get:
 *     summary: Get medicines with low stock (Admin/Doctor only)
 *     description: Retrieve medicines where current stock is below minimum threshold
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved low stock medicines
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
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medicine'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/low-stock - Get low stock medicines (Admin/Doctor only)
router.get('/low-stock', 
  restrictTo('admin', 'doctor'), 
  medicineController.getLowStockMedicines
);

/**
 * @swagger
 * /api/medicines/category/{category}:
 *   get:
 *     summary: Get medicines by category
 *     description: Retrieve all medicines belonging to a specific category
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Antibiotic, Analgesic, Antiviral, Antifungal, Antihistamine, Cardiovascular, Diabetes, Respiratory, Gastrointestinal, Neurological, Psychiatric, Dermatological, Hormonal, Immunosuppressant, Vaccine, Vitamin, Supplement, Other]
 *         description: Medicine category
 *         example: "Antibiotic"
 *     responses:
 *       200:
 *         description: Successfully retrieved medicines by category
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
 *                     $ref: '#/components/schemas/Medicine'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/category/:category - Get medicines by category
router.get('/category/:category', medicineController.getMedicinesByCategory);

/**
 * @swagger
 * /api/medicines/{id}:
 *   get:
 *     summary: Get medicine by ID
 *     description: Retrieve detailed information about a specific medicine
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Successfully retrieved medicine
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/:id - Get medicine by ID
router.get('/:id', medicineController.getMedicineById);

/**
 * @swagger
 * /api/medicines:
 *   post:
 *     summary: Create new medicine (Admin/Doctor only)
 *     description: Add a new medicine to the system with complete pharmaceutical information
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - genericName
 *               - manufacturer
 *               - category
 *               - therapeuticClass
 *               - drugClass
 *               - dosageForm
 *               - strength
 *               - route
 *               - prescriptionRequired
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Paracetamol 500mg Tablets"
 *               genericName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Paracetamol"
 *               manufacturer:
 *                 type: object
 *                 required:
 *                   - name
 *                   - country
 *                   - licenseNumber
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "PharmaCorp Ltd"
 *                   country:
 *                     type: string
 *                     example: "India"
 *                   licenseNumber:
 *                     type: string
 *                     example: "DL-123456789"
 *               category:
 *                 type: string
 *                 enum: [Antibiotic, Analgesic, Antiviral, Antifungal, Antihistamine, Cardiovascular, Diabetes, Respiratory, Gastrointestinal, Neurological, Psychiatric, Dermatological, Hormonal, Immunosuppressant, Vaccine, Vitamin, Supplement, Other]
 *                 example: "Analgesic"
 *               therapeuticClass:
 *                 type: string
 *                 example: "Non-opioid analgesic"
 *               drugClass:
 *                 type: string
 *                 example: "Acetaminophen"
 *               dosageForm:
 *                 type: string
 *                 enum: [Tablet, Capsule, Syrup, Injection, Cream, Ointment, Drops, Inhaler, Patch, Suppository, Powder, Gel]
 *                 example: "Tablet"
 *               strength:
 *                 type: object
 *                 required:
 *                   - value
 *                   - unit
 *                 properties:
 *                   value:
 *                     type: number
 *                     minimum: 0
 *                     example: 500
 *                   unit:
 *                     type: string
 *                     enum: [mg, g, mcg, ml, L, IU, "%"]
 *                     example: "mg"
 *               route:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   enum: [Oral, Intravenous, Intramuscular, Subcutaneous, Topical, Inhalation, Rectal, Vaginal, Nasal, Ophthalmic, Otic]
 *                 example: ["Oral"]
 *               prescriptionRequired:
 *                 type: boolean
 *                 example: false
 *               indications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     condition:
 *                       type: string
 *                       example: "Fever"
 *                     severity:
 *                       type: string
 *                       enum: [Mild, Moderate, Severe]
 *                       example: "Mild"
 *               knownSideEffects:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     effect:
 *                       type: string
 *                       example: "Nausea"
 *                     severity:
 *                       type: string
 *                       enum: [Mild, Moderate, Severe, Life-threatening]
 *                       example: "Mild"
 *               pricing:
 *                 type: object
 *                 properties:
 *                   wholesalePrice:
 *                     type: number
 *                     minimum: 0
 *                     example: 25.50
 *                   retailPrice:
 *                     type: number
 *                     minimum: 0
 *                     example: 30.00
 *               availability:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     minimum: 0
 *                     example: 100
 *                   minimumStock:
 *                     type: integer
 *                     minimum: 0
 *                     example: 10
 *     responses:
 *       201:
 *         description: Medicine created successfully
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
 *                   example: Medicine created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/medicines - Create new medicine (Admin/Doctor only)
router.post('/', 
  restrictTo('admin', 'doctor'),
  createMedicineValidation,
  medicineController.createMedicine
);

/**
 * @swagger
 * /api/medicines/{id}:
 *   put:
 *     summary: Update medicine (Admin/Doctor only)
 *     description: Update medicine information with partial data
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Updated Medicine Name"
 *               genericName:
 *                 type: string
 *                 example: "Updated Generic Name"
 *               category:
 *                 type: string
 *                 enum: [Antibiotic, Analgesic, Antiviral, Antifungal, Antihistamine, Cardiovascular, Diabetes, Respiratory, Gastrointestinal, Neurological, Psychiatric, Dermatological, Hormonal, Immunosuppressant, Vaccine, Vitamin, Supplement, Other]
 *               strength:
 *                 type: object
 *                 properties:
 *                   value:
 *                     type: number
 *                     minimum: 0
 *                   unit:
 *                     type: string
 *                     enum: [mg, g, mcg, ml, L, IU, "%"]
 *               pricing:
 *                 type: object
 *                 properties:
 *                   wholesalePrice:
 *                     type: number
 *                     minimum: 0
 *                   retailPrice:
 *                     type: number
 *                     minimum: 0
 *               availability:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     minimum: 0
 *     responses:
 *       200:
 *         description: Medicine updated successfully
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
 *                   example: Medicine updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Medicine'
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
// PUT /api/medicines/:id - Update medicine (Admin/Doctor only)
router.put('/:id', 
  restrictTo('admin', 'doctor'),
  updateMedicineValidation,
  medicineController.updateMedicine
);

/**
 * @swagger
 * /api/medicines/{id}/stock:
 *   put:
 *     summary: Update medicine stock (Admin/Doctor only)
 *     description: Update the stock quantity and availability status of a medicine
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *                 description: New stock quantity
 *               inStock:
 *                 type: boolean
 *                 example: true
 *                 description: Stock availability status
 *     responses:
 *       200:
 *         description: Stock updated successfully
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
 *                   example: Stock updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     availability:
 *                       type: object
 *                       properties:
 *                         quantity:
 *                           type: integer
 *                           example: 50
 *                         inStock:
 *                           type: boolean
 *                           example: true
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-07T10:30:00.000Z"
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
// PUT /api/medicines/:id/stock - Update medicine stock (Admin/Doctor only)
router.put('/:id/stock', 
  restrictTo('admin', 'doctor'),
  stockUpdateValidation,
  medicineController.updateMedicineStock
);

/**
 * @swagger
 * /api/medicines/{id}:
 *   delete:
 *     summary: Delete medicine (Admin only)
 *     description: Permanently remove a medicine from the system
 *     tags: [Medicines]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Medicine ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       204:
 *         description: Medicine deleted successfully (no content)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// DELETE /api/medicines/:id - Delete medicine (Admin only)
router.delete('/:id', 
  restrictTo('admin'),
  medicineController.deleteMedicine
);

// Fuzzy Search Routes

/**
 * @swagger
 * /api/medicines/fuzzy-search:
 *   get:
 *     summary: Advanced fuzzy search for medicines
 *     description: Perform intelligent fuzzy matching with detailed similarity scores and match information
 *     tags: [Fuzzy Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query for medicine names
 *         example: "paracetmol"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of results
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0.3
 *         description: Minimum similarity score (0-1, higher = more similar)
 *       - in: query
 *         name: includeScore
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include similarity scores in response
 *       - in: query
 *         name: includeMatches
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed match information
 *     responses:
 *       200:
 *         description: Fuzzy search results with similarity scores
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
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           medicine:
 *                             $ref: '#/components/schemas/Medicine'
 *                           matchType:
 *                             type: string
 *                             enum: [exact_name, exact_generic, contains_name, contains_generic, high_similarity_name, high_similarity_generic, fuzzy, prefix_exact_name, prefix_exact_generic]
 *                             example: "high_similarity_name"
 *                           highlightedMatch:
 *                             type: string
 *                             example: "**Paracetamol** 500mg Tablets"
 *                           scores:
 *                             type: object
 *                             properties:
 *                               combined:
 *                                 type: number
 *                                 example: 0.95
 *                               fuse:
 *                                 type: number
 *                                 example: 0.88
 *                               name:
 *                                 type: number
 *                                 example: 0.92
 *                               generic:
 *                                 type: number
 *                                 example: 0.98
 *                     searchQuery:
 *                       type: string
 *                       example: "paracetmol"
 *                     resultsCount:
 *                       type: integer
 *                       example: 5
 *                     searchMetadata:
 *                       type: object
 *                       properties:
 *                         minScore:
 *                           type: number
 *                           example: 0.3
 *                         algorithm:
 *                           type: string
 *                           example: "fuzzy"
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/fuzzy-search - Advanced fuzzy search
router.get('/fuzzy-search', [
  query('query').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('minScore').optional().isFloat({ min: 0, max: 1 }),
  query('includeScore').optional().isBoolean(),
  query('includeMatches').optional().isBoolean()
], medicineController.fuzzySearchMedicines);

/**
 * @swagger
 * /api/medicines/suggestions:
 *   get:
 *     summary: Get medicine suggestions for autocomplete
 *     description: Get intelligent suggestions for partial medicine names (ideal for autocomplete features)
 *     tags: [Fuzzy Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Partial medicine name
 *         example: "para"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Maximum number of suggestions
 *     responses:
 *       200:
 *         description: Medicine suggestions for autocomplete
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
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           name:
 *                             type: string
 *                             example: "Paracetamol 500mg Tablets"
 *                           genericName:
 *                             type: string
 *                             example: "Paracetamol"
 *                           score:
 *                             type: number
 *                             example: 0.95
 *                           matchType:
 *                             type: string
 *                             example: "prefix_exact_name"
 *                           highlightedName:
 *                             type: string
 *                             example: "**Para**cetamol 500mg Tablets"
 *                     query:
 *                       type: string
 *                       example: "para"
 *                     count:
 *                       type: integer
 *                       example: 5
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/suggestions - Autocomplete suggestions
router.get('/suggestions', [
  query('query').isLength({ min: 2 }).withMessage('Query must be at least 2 characters'),
  query('limit').optional().isInt({ min: 1, max: 20 })
], medicineController.getMedicineSuggestions);

/**
 * @swagger
 * /api/medicines/fuzzy-search/category/{category}:
 *   get:
 *     summary: Fuzzy search within a specific category
 *     description: Perform fuzzy search for medicines within a specific category
 *     tags: [Fuzzy Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Antibiotic, Analgesic, Antiviral, Antifungal, Antihistamine, Cardiovascular, Diabetes, Respiratory, Gastrointestinal, Neurological, Psychiatric, Dermatological, Hormonal, Immunosuppressant, Vaccine, Vitamin, Supplement, Other]
 *         description: Medicine category to search within
 *         example: "Analgesic"
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query (optional for all medicines in category)
 *         example: "paracet"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Category-specific fuzzy search results
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
 *                     medicines:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Medicine'
 *                     category:
 *                       type: string
 *                       example: "Analgesic"
 *                     query:
 *                       type: string
 *                       example: "paracet"
 *                     resultsCount:
 *                       type: integer
 *                       example: 8
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/fuzzy-search/category/:category - Category-specific fuzzy search
router.get('/fuzzy-search/category/:category', [
  query('query').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 50 })
], medicineController.fuzzySearchByCategory);

/**
 * @swagger
 * /api/medicines/exact-matches:
 *   get:
 *     summary: Find exact medicine matches
 *     description: Find exact matches for medicine names (useful for validation)
 *     tags: [Fuzzy Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Exact medicine name to search for
 *         example: "Paracetamol"
 *     responses:
 *       200:
 *         description: Exact match results
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
 *                     matches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Medicine'
 *                     query:
 *                       type: string
 *                       example: "Paracetamol"
 *                     hasExactMatch:
 *                       type: boolean
 *                       example: true
 *                     matchCount:
 *                       type: integer
 *                       example: 3
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/exact-matches - Find exact matches
router.get('/exact-matches', [
  query('query').notEmpty().withMessage('Query is required')
], medicineController.findExactMedicineMatches);

/**
 * @swagger
 * /api/medicines/search-analytics:
 *   get:
 *     summary: Get search analytics and performance metrics
 *     description: Retrieve information about the search index and configuration (Admin/Doctor only)
 *     tags: [Fuzzy Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search analytics and metrics
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
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         indexSize:
 *                           type: integer
 *                           example: 1250
 *                         lastUpdate:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-07T10:30:00.000Z"
 *                         cacheStatus:
 *                           type: string
 *                           enum: [fresh, stale]
 *                           example: "fresh"
 *                         configuration:
 *                           type: object
 *                           properties:
 *                             threshold:
 *                               type: number
 *                               example: 0.6
 *                             maxResults:
 *                               type: string
 *                               example: "configurable"
 *                             minMatchLength:
 *                               type: integer
 *                               example: 2
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-12-07T15:45:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// GET /api/medicines/search-analytics - Search analytics (Admin/Doctor only)
router.get('/search-analytics', 
  restrictTo('admin', 'doctor'),
  medicineController.getSearchAnalytics
);

/**
 * @swagger
 * /api/medicines/refresh-index:
 *   post:
 *     summary: Refresh the search index
 *     description: Force refresh of the fuzzy search index (Admin only)
 *     tags: [Fuzzy Search]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search index refreshed successfully
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
 *                   example: "Search index refreshed successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-12-07T16:00:00.000Z"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
// POST /api/medicines/refresh-index - Refresh search index (Admin only)
router.post('/refresh-index',
  restrictTo('admin'),
  medicineController.refreshSearchIndex
);

module.exports = router;