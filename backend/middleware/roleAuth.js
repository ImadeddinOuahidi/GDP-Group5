/**
 * Role-based Authorization Middleware
 * Provides role-based access control for different user types in the healthcare system
 */

/**
 * Middleware to ensure user is a patient
 * Allows patients to access their own data
 */
const requirePatient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.'
    });
  }

  if (req.user.role !== 'patient') {
    return res.status(403).json({
      success: false,
      message: 'Patient access required.'
    });
  }

  next();
};

/**
 * Middleware to ensure user is a healthcare provider (doctor, nurse, etc.)
 */
const requireHealthcareProvider = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.'
    });
  }

  const allowedRoles = ['doctor', 'nurse', 'healthcare_provider', 'provider'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Healthcare provider access required.'
    });
  }

  next();
};

/**
 * Middleware to ensure user is an administrator
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Administrator access required.'
    });
  }

  next();
};

/**
 * Middleware to allow patients to access their own data or healthcare providers/admins to access any data
 */
const allowPatientOrProvider = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.'
    });
  }

  const userId = req.params.userId || req.params.patientId || req.body.userId;
  const providerRoles = ['doctor', 'nurse', 'healthcare_provider', 'provider', 'admin'];

  // Allow if user is a healthcare provider/admin or if patient is accessing their own data
  if (providerRoles.includes(req.user.role) || 
      (req.user.role === 'patient' && req.user._id.toString() === userId)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'You can only access your own data or you need healthcare provider access.'
    });
  }
};

/**
 * Middleware to allow patients to access their own symptom progressions
 * For symptom progression specific access control
 */
const allowPatientProgressionAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please login first.'
    });
  }

  try {
    // For healthcare providers and admins, allow all access
    const providerRoles = ['doctor', 'nurse', 'healthcare_provider', 'provider', 'admin'];
    if (providerRoles.includes(req.user.role)) {
      return next();
    }

    // For patients, they can only access their own progressions
    if (req.user.role === 'patient') {
      // If creating a new progression, check if they're creating for themselves
      if (req.method === 'POST' && req.body.userId && req.body.userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Patients can only create symptom progressions for themselves.'
        });
      }

      // For GET requests with userId query, ensure they're accessing their own data
      if (req.query.userId && req.query.userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Patients can only access their own symptom progressions.'
        });
      }

      return next();
    }

    // If role is not recognized
    return res.status(403).json({
      success: false,
      message: 'Invalid user role for this operation.'
    });

  } catch (error) {
    console.error('Role authorization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authorization.'
    });
  }
};

/**
 * Flexible role checking middleware
 * @param {Array} allowedRoles - Array of roles allowed to access the resource
 */
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login first.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has specific permissions
 * @param {string|Array} permissions - Permission(s) to check
 */
const requirePermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login first.'
      });
    }

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      req.user.permissions && req.user.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        message: `Missing required permissions: ${requiredPermissions.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  requirePatient,
  requireHealthcareProvider,
  requireAdmin,
  allowPatientOrProvider,
  allowPatientProgressionAccess,
  requireRoles,
  requirePermissions
};