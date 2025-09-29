const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  // Basic medicine information
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    maxlength: [100, 'Medicine name cannot exceed 100 characters']
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true,
    maxlength: [100, 'Generic name cannot exceed 100 characters']
  },
  brandName: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  manufacturer: {
    name: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Manufacturer country is required'],
      trim: true
    },
    licenseNumber: {
      type: String,
      required: [true, 'Manufacturer license number is required']
    }
  },
  
  // Drug classification
  category: {
    type: String,
    required: [true, 'Medicine category is required'],
    enum: [
      'Antibiotic', 'Analgesic', 'Antiviral', 'Antifungal', 'Antihistamine',
      'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal',
      'Neurological', 'Psychiatric', 'Dermatological', 'Hormonal',
      'Immunosuppressant', 'Vaccine', 'Vitamin', 'Supplement', 'Other'
    ]
  },
  therapeuticClass: {
    type: String,
    required: [true, 'Therapeutic class is required'],
    trim: true
  },
  drugClass: {
    type: String,
    required: [true, 'Drug class is required'],
    trim: true
  },
  
  // Dosage and administration
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: [
      'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
      'Drops', 'Inhaler', 'Patch', 'Suppository', 'Powder', 'Gel'
    ]
  },
  strength: {
    value: {
      type: Number,
      required: [true, 'Strength value is required'],
      min: [0, 'Strength must be positive']
    },
    unit: {
      type: String,
      required: [true, 'Strength unit is required'],
      enum: ['mg', 'g', 'mcg', 'ml', 'L', 'IU', '%']
    }
  },
  route: {
    type: [String],
    required: [true, 'Route of administration is required'],
    enum: [
      'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical',
      'Inhalation', 'Rectal', 'Vaginal', 'Nasal', 'Ophthalmic', 'Otic'
    ]
  },
  
  // Prescription information
  prescriptionRequired: {
    type: Boolean,
    required: [true, 'Prescription requirement must be specified'],
    default: true
  },
  controlledSubstance: {
    isControlled: {
      type: Boolean,
      default: false
    },
    schedule: {
      type: String,
      enum: ['I', 'II', 'III', 'IV', 'V'],
      required: function() { return this.controlledSubstance.isControlled; }
    }
  },
  
  // Medical information
  indications: [{
    condition: {
      type: String,
      required: true,
      trim: true
    },
    description: String
  }],
  contraindications: [{
    condition: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['Absolute', 'Relative'],
      required: true
    },
    description: String
  }],
  knownSideEffects: [{
    effect: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening'],
      required: true
    },
    frequency: {
      type: String,
      enum: ['Very common', 'Common', 'Uncommon', 'Rare', 'Very rare'],
      required: true
    },
    description: String
  }],
  interactions: [{
    type: {
      type: String,
      enum: ['Drug-Drug', 'Drug-Food', 'Drug-Disease'],
      required: true
    },
    interactsWith: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['Minor', 'Moderate', 'Major'],
      required: true
    },
    description: String,
    management: String
  }],
  
  // Dosing information
  dosing: {
    adult: {
      standardDose: String,
      maxDose: String,
      frequency: String,
      duration: String
    },
    pediatric: {
      standardDose: String,
      maxDose: String,
      frequency: String,
      duration: String,
      ageRestriction: String
    },
    elderly: {
      adjustedDose: String,
      specialConsiderations: String
    },
    renalAdjustment: String,
    hepaticAdjustment: String
  },
  
  // Storage and expiry
  storage: {
    temperature: {
      min: Number,
      max: Number,
      unit: {
        type: String,
        enum: ['Celsius', 'Fahrenheit'],
        default: 'Celsius'
      }
    },
    humidity: String,
    lightProtection: {
      type: Boolean,
      default: false
    },
    specialInstructions: String
  },
  shelfLife: {
    duration: Number,
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months'
    }
  },
  
  // Regulatory and approval information
  approvalInfo: {
    fdaApproved: {
      type: Boolean,
      default: false
    },
    approvalDate: Date,
    ndc: String, // National Drug Code
    approvalNumber: String
  },
  
  // Pricing and availability
  pricing: {
    wholesalePrice: {
      type: Number,
      min: 0
    },
    retailPrice: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  availability: {
    inStock: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      min: 0,
      default: 0
    },
    minimumStock: {
      type: Number,
      min: 0,
      default: 10
    },
    supplier: {
      name: String,
      contact: String
    }
  },
  
  // Additional information
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  warnings: [{
    type: String,
    trim: true
  }],
  precautions: [{
    type: String,
    trim: true
  }],
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },
  discontinuedDate: Date,
  discontinuedReason: String,
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes for better query performance
medicineSchema.index({ name: 1 });
medicineSchema.index({ genericName: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ 'manufacturer.name': 1 });
medicineSchema.index({ prescriptionRequired: 1 });
medicineSchema.index({ isActive: 1 });

// Virtual for full medicine identification
medicineSchema.virtual('fullName').get(function() {
  return this.brandName ? `${this.name} (${this.brandName})` : this.name;
});

// Virtual for strength display
medicineSchema.virtual('strengthDisplay').get(function() {
  return `${this.strength.value}${this.strength.unit}`;
});

// Virtual to check if medicine is low in stock
medicineSchema.virtual('isLowStock').get(function() {
  return this.availability.quantity <= this.availability.minimumStock;
});

// Virtual to check if medicine is expired (requires manufacturing date in real implementation)
medicineSchema.virtual('isExpired').get(function() {
  // This would need manufacturing date to calculate properly
  return false;
});

// Pre-save middleware to update timestamps
medicineSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find medicines by category
medicineSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category, 
    isActive: true, 
    isDiscontinued: false 
  });
};

// Static method to find prescription medicines
medicineSchema.statics.findPrescriptionMedicines = function() {
  return this.find({ 
    prescriptionRequired: true, 
    isActive: true, 
    isDiscontinued: false 
  });
};

// Static method to find over-the-counter medicines
medicineSchema.statics.findOTCMedicines = function() {
  return this.find({ 
    prescriptionRequired: false, 
    isActive: true, 
    isDiscontinued: false 
  });
};

// Static method to search medicines by name or generic name
medicineSchema.statics.searchByName = function(searchTerm) {
  const regex = new RegExp(searchTerm, 'i');
  return this.find({
    $or: [
      { name: regex },
      { genericName: regex },
      { brandName: regex }
    ],
    isActive: true,
    isDiscontinued: false
  });
};

// Instance method to check if medicine has specific side effect
medicineSchema.methods.hasSideEffect = function(sideEffect) {
  return this.knownSideEffects.some(effect => 
    effect.effect.toLowerCase().includes(sideEffect.toLowerCase())
  );
};

// Instance method to get side effects by severity
medicineSchema.methods.getSideEffectsBySeverity = function(severity) {
  return this.knownSideEffects.filter(effect => effect.severity === severity);
};

module.exports = mongoose.model('Medicine', medicineSchema);