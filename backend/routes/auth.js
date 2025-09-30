const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Validation rules for signup
const signupValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('phone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('role')
    .optional()
    .isIn(['admin', 'doctor', 'patient'])
    .withMessage('Role must be admin, doctor, or patient'),
  
  // Address validation
  body('address.street')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address is required'),
  
  body('address.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  
  body('address.state')
    .trim()
    .isLength({ min: 2 })
    .withMessage('State is required'),
  
  body('address.zipCode')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Zip code is required'),
  
  // Doctor-specific validation
  body('doctorInfo.licenseNumber')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('License number is required for doctors'),
  
  body('doctorInfo.specialization')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Specialization is required for doctors'),
  
  body('doctorInfo.yearsOfExperience')
    .if(body('role').equals('doctor'))
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  
  body('doctorInfo.consultationFee')
    .if(body('role').equals('doctor'))
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  // Patient-specific validation
  body('patientInfo.emergencyContact.name')
    .if(body('role').equals('patient'))
    .notEmpty()
    .withMessage('Emergency contact name is required for patients'),
  
  body('patientInfo.emergencyContact.phone')
    .if(body('role').equals('patient'))
    .isMobilePhone()
    .withMessage('Emergency contact phone must be valid'),
  
  body('patientInfo.bloodGroup')
    .if(body('role').equals('patient'))
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Blood group must be valid'),
  
  // Admin-specific validation
  body('adminInfo.department')
    .if(body('role').equals('admin'))
    .notEmpty()
    .withMessage('Department is required for admins'),
  
  body('adminInfo.employeeId')
    .if(body('role').equals('admin'))
    .notEmpty()
    .withMessage('Employee ID is required for admins')
];

// Validation rules for signin
const signinValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with role-based registration (patient, doctor, or admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *           examples:
 *             patient:
 *               summary: Patient Registration
 *               value:
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 email: "john.doe@example.com"
 *                 password: "SecurePass123"
 *                 phone: "+1234567890"
 *                 dateOfBirth: "1990-01-01"
 *                 gender: "male"
 *                 role: "patient"
 *                 address:
 *                   street: "123 Main St"
 *                   city: "New York"
 *                   state: "NY"
 *                   zipCode: "10001"
 *                   country: "USA"
 *                 patientInfo:
 *                   emergencyContact:
 *                     name: "Jane Doe"
 *                     relationship: "spouse"
 *                     phone: "+1234567891"
 *                   bloodGroup: "O+"
 *             doctor:
 *               summary: Doctor Registration
 *               value:
 *                 firstName: "Dr. Sarah"
 *                 lastName: "Smith"
 *                 email: "dr.smith@hospital.com"
 *                 password: "SecurePass123"
 *                 phone: "+1234567892"
 *                 dateOfBirth: "1985-05-15"
 *                 gender: "female"
 *                 role: "doctor"
 *                 address:
 *                   street: "456 Medical Ave"
 *                   city: "Boston"
 *                   state: "MA"
 *                   zipCode: "02101"
 *                 doctorInfo:
 *                   licenseNumber: "MD123456"
 *                   specialization: "Cardiology"
 *                   yearsOfExperience: 10
 *                   consultationFee: 200
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation errors or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', signupValidation, authController.signup);

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     tags: [Authentication]
 *     summary: Sign in user
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignin'
 *           example:
 *             email: "john.doe@example.com"
 *             password: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signin', signinValidation, authController.signin);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify email address
 *     description: Verify user's email address using verification token
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *         example: "abc123def456ghi789"
 *     responses:
 *       200:
 *         description: Email verified successfully
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
 *                   example: "Email verified successfully"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], authController.resendVerificationEmail);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', protect, authController.getProfile);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     tags: [Authentication]
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               phone:
 *                 type: string
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *           example:
 *             firstName: "John"
 *             lastName: "Smith"
 *             phone: "+1234567890"
 *             address:
 *               street: "456 New St"
 *               city: "Boston"
 *               state: "MA"
 *               zipCode: "02101"
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/profile', [
  protect,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  // Address validation
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage('Street address must be at least 5 characters'),
  
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters'),
  
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('State must be at least 2 characters'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ min: 5 })
    .withMessage('Zip code must be at least 5 characters')
], authController.updateProfile);

// PUT /api/auth/change-password - Change user password (protected route)
router.put('/change-password', [
  protect,
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
], authController.changePassword);

// PUT /api/auth/profile-picture - Update profile picture (protected route)
router.put('/profile-picture', [
  protect,
  body('profilePicture')
    .isURL()
    .withMessage('Profile picture must be a valid URL')
], authController.updateProfilePicture);

// DELETE /api/auth/deactivate - Deactivate user account (protected route)
router.delete('/deactivate', [
  protect,
  body('password')
    .notEmpty()
    .withMessage('Password is required to deactivate account')
], authController.deactivateAccount);

module.exports = router;