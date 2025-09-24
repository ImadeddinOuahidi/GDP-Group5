const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' }
  },
  
  // Role-based information
  role: {
    type: String,
    enum: ['admin', 'doctor', 'patient'],
    required: [true, 'User role is required'],
    default: 'patient'
  },
  
  // Doctor-specific fields
  doctorInfo: {
    licenseNumber: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    },
    specialization: {
      type: String,
      required: function() { return this.role === 'doctor'; }
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      required: function() { return this.role === 'doctor'; }
    },
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    certifications: [String],
    consultationFee: {
      type: Number,
      min: 0,
      required: function() { return this.role === 'doctor'; }
    },
    availability: {
      days: [String], // ['monday', 'tuesday', etc.]
      timeSlots: [{
        start: String, // '09:00'
        end: String    // '17:00'
      }]
    },
    hospitalAffiliation: String,
    biography: String
  },
  
  // Patient-specific fields
  patientInfo: {
    emergencyContact: {
      name: {
        type: String,
        required: function() { return this.role === 'patient'; }
      },
      relationship: {
        type: String,
        required: function() { return this.role === 'patient'; }
      },
      phone: {
        type: String,
        required: function() { return this.role === 'patient'; }
      }
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: function() { return this.role === 'patient'; }
    },
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String
    }],
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      groupNumber: String
    },
    preferredLanguage: {
      type: String,
      default: 'English'
    }
  },
  
  // Admin-specific fields
  adminInfo: {
    department: {
      type: String,
      required: function() { return this.role === 'admin'; }
    },
    permissions: [{
      type: String,
      enum: ['user_management', 'doctor_management', 'patient_management', 'system_settings', 'reports', 'billing']
    }],
    employeeId: {
      type: String,
      required: function() { return this.role === 'admin'; }
    }
  },
  
  // Common fields for all users
  profilePicture: {
    type: String, // URL to the image
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if user has specific permission (for admins)
userSchema.methods.hasPermission = function(permission) {
  if (this.role !== 'admin') return false;
  return this.adminInfo.permissions.includes(permission);
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true });
};

// Static method to find available doctors
userSchema.statics.findAvailableDoctors = function(specialization = null) {
  const query = { 
    role: 'doctor', 
    isActive: true 
  };
  
  if (specialization) {
    query['doctorInfo.specialization'] = specialization;
  }
  
  return this.find(query).select('firstName lastName doctorInfo.specialization doctorInfo.consultationFee doctorInfo.availability');
};

module.exports = mongoose.model('User', userSchema);