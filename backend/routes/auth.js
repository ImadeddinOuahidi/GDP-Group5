const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

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

// POST /api/auth/signup - Register a new user
router.post('/signup', signupValidation, authController.signup);

// POST /api/auth/signin - Login user
router.post('/signin', signinValidation, authController.signin);

// GET /api/auth/verify-email - Verify email address
router.get('/verify-email', authController.verifyEmail);

// POST /api/auth/resend-verification - Resend verification email
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], authController.resendVerificationEmail);

// GET /api/auth/profile - Get current user profile (protected route)
router.get('/profile', protect, authController.getProfile);

// PUT /api/auth/profile - Update user profile (protected route)
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