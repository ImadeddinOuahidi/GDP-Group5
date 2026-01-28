const mongoose = require('mongoose');

const reportSideEffectSchema = new mongoose.Schema({
  // Reporter information
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  reporterRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'pharmacist', 'caregiver'],
    required: [true, 'Reporter role is required']
  },
  
  // Medicine information
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: [true, 'Medicine is required']
  },
  medicineDetails: {
    batchNumber: {
      type: String,
      trim: true
    },
    expiryDate: Date,
    manufacturer: String,
    dosageForm: String,
    strength: String
  },
  
  // Patient information (if reported by someone other than patient)
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  patientInfo: {
    age: {
      type: Number,
      min: 0,
      max: 150
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['kg', 'lbs'],
        default: 'kg'
      }
    },
    height: {
      value: Number,
      unit: {
        type: String,
        enum: ['cm', 'ft'],
        default: 'cm'
      }
    },
    medicalHistory: [String],
    allergies: [String],
    concomitantMedications: [{
      medicineName: String,
      dosage: String,
      startDate: Date,
      endDate: Date
    }]
  },
  
  // Side effect details
  sideEffects: [{
    effect: {
      type: String,
      required: [true, 'Side effect description is required'],
      trim: true
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening'],
      required: [true, 'Severity is required']
    },
    onset: {
      type: String,
      enum: ['Immediate', 'Within hours', 'Within days', 'Within weeks', 'Unknown'],
      required: [true, 'Onset time is required']
    },
    duration: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days', 'weeks', 'months', 'ongoing'],
        default: 'hours'
      }
    },
    frequency: {
      type: String,
      enum: ['Once', 'Intermittent', 'Continuous', 'Unknown'],
      default: 'Unknown'
    },
    bodySystem: {
      type: String,
      enum: [
        'Gastrointestinal', 'Cardiovascular', 'Respiratory', 'Nervous System',
        'Musculoskeletal', 'Dermatological', 'Genitourinary', 'Endocrine',
        'Hematological', 'Psychiatric', 'Ocular', 'Otic', 'Other', 'Unknown'
      ],
      default: 'Unknown'
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    treatmentRequired: {
      type: Boolean,
      default: false
    },
    treatment: {
      type: String,
      maxlength: [300, 'Treatment description cannot exceed 300 characters']
    }
  }],
  
  // Medication usage details
  medicationUsage: {
    indication: {
      type: String,
      required: [true, 'Indication for medicine use is required'],
      trim: true
    },
    dosage: {
      amount: {
        type: String,
        required: [true, 'Dosage amount is required']
      },
      frequency: {
        type: String,
        required: [true, 'Dosage frequency is required']
      },
      route: {
        type: String,
        enum: [
          'Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical',
          'Inhalation', 'Rectal', 'Vaginal', 'Nasal', 'Ophthalmic', 'Otic'
        ],
        required: [true, 'Route of administration is required']
      }
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: Date,
    adherence: {
      type: String,
      enum: ['Excellent', 'Good', 'Poor', 'Unknown'],
      default: 'Unknown'
    },
    missedDoses: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // Report details
  reportDetails: {
    incidentDate: {
      type: Date,
      required: [true, 'Incident date is required']
    },
    reportDate: {
      type: Date,
      default: Date.now
    },
    reportType: {
      type: String,
      enum: ['Spontaneous', 'Solicited', 'Literature', 'Study'],
      default: 'Spontaneous'
    },
    seriousness: {
      type: String,
      enum: ['Serious', 'Non-serious'],
      required: [true, 'Seriousness assessment is required']
    },
    seriousnessReason: {
      type: [String],
      enum: [
        'Death', 'Life-threatening', 'Hospitalization', 
        'Persistent disability', 'Congenital anomaly', 
        'Medically important', 'Other'
      ]
    },
    outcome: {
      type: String,
      enum: [
        'Recovered/Resolved', 'Recovering', 'Not recovered', 
        'Recovered with sequelae', 'Fatal', 'Unknown'
      ],
      required: [true, 'Outcome is required']
    },
    rechallenge: {
      performed: {
        type: Boolean,
        default: false
      },
      result: {
        type: String,
        enum: ['Positive', 'Negative', 'Unknown']
      }
    },
    dechallenge: {
      performed: {
        type: Boolean,
        default: false
      },
      result: {
        type: String,
        enum: ['Positive', 'Negative', 'Unknown']
      }
    }
  },
  
  // Causality assessment
  causalityAssessment: {
    algorithm: {
      type: String,
      enum: ['WHO-UMC', 'Naranjo', 'CIOMS/RUCAM', 'Other', 'Not assessed'],
      default: 'Not assessed'
    },
    score: Number,
    category: {
      type: String,
      enum: [
        'Certain', 'Probable', 'Possible', 'Unlikely', 
        'Conditional', 'Unassessable', 'Unclassifiable'
      ]
    },
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assessmentDate: Date,
    comments: String
  },
  
  // Follow-up information
  followUp: [{
    date: {
      type: Date,
      default: Date.now
    },
    informationType: {
      type: String,
      enum: ['Additional information', 'Correction', 'Follow-up report'],
      required: true
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Follow-up description cannot exceed 500 characters']
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Report status and workflow
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Under Review', 'Reviewed', 'Closed', 'Rejected'],
    default: 'Draft'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Regulatory information
  regulatoryInfo: {
    reportedToAuthority: {
      type: Boolean,
      default: false
    },
    authorityName: String,
    reportNumber: String,
    reportDate: Date,
    expeditedReporting: {
      required: {
        type: Boolean,
        default: false
      },
      deadline: Date,
      submitted: {
        type: Boolean,
        default: false
      },
      submissionDate: Date
    }
  },
  
  // Quality and completeness
  dataQuality: {
    completeness: {
      type: String,
      enum: ['Complete', 'Incomplete', 'Minimal'],
      default: 'Incomplete'
    },
    missingInformation: [String],
    additionalInformationNeeded: {
      type: Boolean,
      default: false
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  
  // AI Analysis Metadata
  metadata: {
    aiProcessed: {
      type: Boolean,
      default: false
    },
    aiProcessedAt: Date,
    aiProcessingAttempts: {
      type: Number,
      default: 0
    },
    aiProcessingError: String,
    aiAnalysis: {
      severity: {
        level: {
          type: String,
          enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening']
        },
        confidence: Number,
        reasoning: String
      },
      priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical']
      },
      seriousness: {
        classification: {
          type: String,
          enum: ['Serious', 'Non-serious']
        },
        reasons: [String]
      },
      bodySystemsAffected: [String],
      riskFactors: [String],
      recommendedActions: [String],
      causalityAssessment: {
        likelihood: {
          type: String,
          enum: ['Certain', 'Probable', 'Possible', 'Unlikely', 'Unassessable']
        },
        reasoning: String
      },
      keywords: [String],
      summary: String,
      overallRiskScore: Number,
      // Patient-facing guidance from AI
      patientGuidance: {
        urgencyLevel: {
          type: String,
          enum: ['routine', 'soon', 'urgent', 'emergency'],
          default: 'routine'
        },
        recommendation: String,  // Main guidance message
        nextSteps: [String],     // Action items for patient
        warningSignsToWatch: [String],  // Red flags to monitor
        canContinueMedication: {
          type: Boolean,
          default: true
        },
        shouldSeekMedicalAttention: {
          type: Boolean,
          default: false
        }
      },
      model: String,
      processedAt: Date
    },
    aiModelUsed: String,
    aiRiskScore: Number
  },
  
  // Doctor Review Request
  doctorReview: {
    requested: {
      type: Boolean,
      default: false
    },
    requestedAt: Date,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestReason: String,
    // Review status
    status: {
      type: String,
      enum: ['not_requested', 'pending', 'in_review', 'completed'],
      default: 'not_requested'
    },
    // Assigned doctor
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    // Doctor's review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    // Doctor's remarks/notes
    remarks: String,
    // Doctor's assessment
    doctorAssessment: {
      agreedWithAI: Boolean,
      severityOverride: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening']
      },
      recommendation: String,
      actionRequired: {
        type: String,
        enum: ['none', 'monitor', 'adjust_dosage', 'stop_medication', 'seek_emergency', 'schedule_appointment'],
        default: 'none'
      },
      followUpRequired: {
        type: Boolean,
        default: false
      },
      followUpDate: Date,
      additionalNotes: String
    }
  },
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Audit trail
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
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
reportSideEffectSchema.index({ reportedBy: 1 });
reportSideEffectSchema.index({ medicine: 1 });
reportSideEffectSchema.index({ patient: 1 });
reportSideEffectSchema.index({ status: 1 });
reportSideEffectSchema.index({ priority: 1 });
reportSideEffectSchema.index({ 'reportDetails.incidentDate': 1 });
reportSideEffectSchema.index({ 'reportDetails.seriousness': 1 });
reportSideEffectSchema.index({ isActive: 1, isDeleted: 1 });

// Compound indexes
reportSideEffectSchema.index({ medicine: 1, status: 1 });
reportSideEffectSchema.index({ reportedBy: 1, 'reportDetails.reportDate': -1 });

// Virtual for report age in days
reportSideEffectSchema.virtual('reportAge').get(function() {
  const now = new Date();
  const reportDate = this.reportDetails.reportDate;
  const diffTime = Math.abs(now - reportDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual to check if expedited reporting is overdue
reportSideEffectSchema.virtual('isExpeditedOverdue').get(function() {
  if (!this.regulatoryInfo.expeditedReporting.required) return false;
  if (this.regulatoryInfo.expeditedReporting.submitted) return false;
  
  const deadline = this.regulatoryInfo.expeditedReporting.deadline;
  return deadline && new Date() > deadline;
});

// Virtual for overall severity (highest severity among all side effects)
reportSideEffectSchema.virtual('overallSeverity').get(function() {
  const severityOrder = { 'Mild': 1, 'Moderate': 2, 'Severe': 3, 'Life-threatening': 4 };
  let maxSeverity = 'Mild';
  
  this.sideEffects.forEach(effect => {
    if (severityOrder[effect.severity] > severityOrder[maxSeverity]) {
      maxSeverity = effect.severity;
    }
  });
  
  return maxSeverity;
});

// Pre-save middleware
reportSideEffectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-assign priority based on severity and seriousness
  if (this.reportDetails.seriousness === 'Serious' || this.overallSeverity === 'Life-threatening') {
    this.priority = 'Critical';
  } else if (this.overallSeverity === 'Severe') {
    this.priority = 'High';
  }
  
  // Set quality score based on completeness
  this.dataQuality.qualityScore = this.calculateQualityScore();
  
  next();
});

// Method to calculate quality score
reportSideEffectSchema.methods.calculateQualityScore = function() {
  let score = 0;
  const maxScore = 100;
  
  // Basic required information (40 points)
  if (this.reportedBy) score += 10;
  if (this.medicine) score += 10;
  if (this.sideEffects.length > 0) score += 10;
  if (this.reportDetails.incidentDate) score += 10;
  
  // Medical details (30 points)
  if (this.medicationUsage.indication) score += 5;
  if (this.medicationUsage.dosage.amount) score += 5;
  if (this.medicationUsage.startDate) score += 5;
  if (this.patientInfo.age) score += 5;
  if (this.patientInfo.gender) score += 5;
  if (this.reportDetails.outcome) score += 5;
  
  // Advanced information (30 points)
  if (this.causalityAssessment.category) score += 10;
  if (this.medicineDetails.batchNumber) score += 5;
  if (this.patientInfo.concomitantMedications.length > 0) score += 5;
  if (this.reportDetails.rechallenge.performed) score += 5;
  if (this.reportDetails.dechallenge.performed) score += 5;
  
  return Math.min(score, maxScore);
};

// Static method to find reports by medicine
reportSideEffectSchema.statics.findByMedicine = function(medicineId) {
  return this.find({ 
    medicine: medicineId, 
    isActive: true, 
    isDeleted: false 
  }).populate('medicine reportedBy patient');
};

// Static method to find serious reports
reportSideEffectSchema.statics.findSeriousReports = function() {
  return this.find({ 
    'reportDetails.seriousness': 'Serious', 
    isActive: true, 
    isDeleted: false 
  }).populate('medicine reportedBy patient');
};

// Static method to find reports by status
reportSideEffectSchema.statics.findByStatus = function(status) {
  return this.find({ 
    status: status, 
    isActive: true, 
    isDeleted: false 
  }).populate('medicine reportedBy patient');
};

// Instance method to add follow-up information
reportSideEffectSchema.methods.addFollowUp = function(followUpData) {
  this.followUp.push(followUpData);
  this.version += 1;
  return this.save();
};

// Instance method to update status
reportSideEffectSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  this.lastModifiedBy = userId;
  this.version += 1;
  return this.save();
};

module.exports = mongoose.model('ReportSideEffect', reportSideEffectSchema);