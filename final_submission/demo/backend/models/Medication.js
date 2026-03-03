/**
 * Medication Model
 * 
 * Purpose: Store medications that patients can reference when reporting side effects.
 * 
 * Flow:
 * 1. Doctors create predefined medications that patients commonly use
 * 2. Patients can select from predefined medications when reporting side effects
 * 3. Patients can also create custom medications if theirs isn't in the list
 * 
 * Design Principles:
 * - Simple and focused on the core use case
 * - Easy to extend for future requirements
 * - Separate from complex pharmaceutical inventory management
 */

const mongoose = require('mongoose');

/**
 * Medication Categories - Common therapeutic categories
 */
const MEDICATION_CATEGORIES = [
  'Analgesic',         // Pain relievers
  'Antibiotic',        // Antibacterial medications
  'Antiviral',         // Antiviral medications
  'Antifungal',        // Antifungal medications
  'Antihistamine',     // Allergy medications
  'Cardiovascular',    // Heart and blood pressure medications
  'Diabetes',          // Diabetes medications
  'Respiratory',       // Asthma, COPD medications
  'Gastrointestinal',  // Stomach, digestive medications
  'Neurological',      // Nerve-related medications
  'Psychiatric',       // Mental health medications
  'Dermatological',    // Skin medications
  'Hormonal',          // Hormone-related medications
  'Supplement',        // Vitamins, supplements
  'Other'              // Catch-all for other medications
];

/**
 * Dosage Forms - Common medication forms
 */
const DOSAGE_FORMS = [
  'Tablet',
  'Capsule',
  'Liquid/Syrup',
  'Injection',
  'Cream/Ointment',
  'Drops',
  'Inhaler',
  'Patch',
  'Powder',
  'Other'
];

/**
 * Medication Source - Who added this medication
 */
const MEDICATION_SOURCES = [
  'predefined',  // Created by doctor/admin as a common medication
  'patient'      // Created by patient during side effect reporting
];

const medicationSchema = new mongoose.Schema(
  {
    // Basic medication information
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [150, 'Medication name cannot exceed 150 characters'],
      index: true
    },
    
    genericName: {
      type: String,
      trim: true,
      maxlength: [150, 'Generic name cannot exceed 150 characters']
    },
    
    // Category for easy filtering
    category: {
      type: String,
      enum: {
        values: MEDICATION_CATEGORIES,
        message: 'Invalid medication category'
      },
      default: 'Other'
    },
    
    // Common dosage form
    dosageForm: {
      type: String,
      enum: {
        values: DOSAGE_FORMS,
        message: 'Invalid dosage form'
      }
    },
    
    // Common strengths (e.g., "500mg", "10mg/5ml")
    commonStrengths: [{
      type: String,
      trim: true
    }],
    
    // Brief description of what the medication is used for
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    // Source of this medication entry
    source: {
      type: String,
      enum: {
        values: MEDICATION_SOURCES,
        message: 'Invalid medication source'
      },
      default: 'predefined'
    },
    
    // Who created this medication entry
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Track creator's role for analytics
    creatorRole: {
      type: String,
      enum: ['admin', 'doctor', 'patient'],
      required: true
    },
    
    // Status flags
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Is this a verified/approved medication (by doctors/admins)
    isVerified: {
      type: Boolean,
      default: false
    },
    
    // Who verified this medication
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    verifiedAt: {
      type: Date
    },
    
    // Usage statistics (for popularity/sorting)
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Tags for better searchability
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
medicationSchema.index({ name: 'text', genericName: 'text', description: 'text' });
medicationSchema.index({ category: 1, isActive: 1 });
medicationSchema.index({ source: 1, isActive: 1 });
medicationSchema.index({ createdBy: 1 });
medicationSchema.index({ usageCount: -1 }); // For popular medications

// Pre-save middleware for normalization
medicationSchema.pre('save', function(next) {
  // Normalize name
  if (this.name) {
    this.name = this.name.trim();
  }
  
  // Normalize generic name
  if (this.genericName) {
    this.genericName = this.genericName.trim();
  }
  
  // Auto-set verification for doctor/admin created medications
  if (this.isNew && (this.creatorRole === 'doctor' || this.creatorRole === 'admin')) {
    this.isVerified = true;
    this.verifiedBy = this.createdBy;
    this.verifiedAt = new Date();
  }
  
  next();
});

// Static method: Find medications by search term
medicationSchema.statics.search = async function(searchTerm, options = {}) {
  const {
    limit = 20,
    includePatientCreated = true,
    category = null,
    onlyVerified = false
  } = options;
  
  const query = {
    isActive: true,
    $or: [
      { name: new RegExp(searchTerm, 'i') },
      { genericName: new RegExp(searchTerm, 'i') },
      { tags: new RegExp(searchTerm, 'i') }
    ]
  };
  
  if (!includePatientCreated) {
    query.source = 'predefined';
  }
  
  if (category) {
    query.category = category;
  }
  
  if (onlyVerified) {
    query.isVerified = true;
  }
  
  return this.find(query)
    .sort({ usageCount: -1, name: 1 })
    .limit(limit)
    .select('name genericName category dosageForm commonStrengths description source isVerified');
};

// Static method: Get popular medications
medicationSchema.statics.getPopular = async function(limit = 10) {
  return this.find({ isActive: true, isVerified: true })
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('name genericName category dosageForm commonStrengths description');
};

// Static method: Get medications by category
medicationSchema.statics.getByCategory = async function(category, limit = 50) {
  return this.find({ category, isActive: true })
    .sort({ usageCount: -1, name: 1 })
    .limit(limit)
    .select('name genericName category dosageForm commonStrengths description source isVerified');
};

// Instance method: Increment usage count
medicationSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return this.save();
};

// Instance method: Verify medication
medicationSchema.methods.verify = async function(verifierId) {
  this.isVerified = true;
  this.verifiedBy = verifierId;
  this.verifiedAt = new Date();
  return this.save();
};

// Virtual: Display name with generic name
medicationSchema.virtual('displayName').get(function() {
  if (this.genericName && this.genericName !== this.name) {
    return `${this.name} (${this.genericName})`;
  }
  return this.name;
});

// Export constants for use in other parts of the application
medicationSchema.statics.CATEGORIES = MEDICATION_CATEGORIES;
medicationSchema.statics.DOSAGE_FORMS = DOSAGE_FORMS;
medicationSchema.statics.SOURCES = MEDICATION_SOURCES;

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication;
