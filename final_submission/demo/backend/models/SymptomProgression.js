const mongoose = require('mongoose');

const symptomProgressionSchema = new mongoose.Schema({
  // Reference to the original side effect report
  originalReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReportSideEffect',
    required: [true, 'Original report reference is required'],
    index: true
  },
  
  // Patient information
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient is required'],
    index: true
  },
  
  // Medicine information
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine is required'],
    index: true
  },
  
  // Specific symptom being tracked
  symptom: {
    originalSideEffectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Symptom name is required'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    bodySystem: {
      type: String,
      enum: [
        'Gastrointestinal', 'Cardiovascular', 'Respiratory', 'Nervous System',
        'Musculoskeletal', 'Dermatological', 'Genitourinary', 'Endocrine',
        'Hematological', 'Psychiatric', 'Ocular', 'Otic', 'Other'
      ],
      required: [true, 'Body system is required']
    }
  },
  
  // Timeline tracking
  timeline: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      index: true
    },
    endDate: {
      type: Date,
      index: true
    },
    isOngoing: {
      type: Boolean,
      default: true
    },
    totalDuration: {
      // Calculated field in days
      type: Number,
      default: 0
    }
  },
  
  // Progression entries - array of symptom updates over time
  progressionEntries: [{
    entryDate: {
      type: Date,
      required: [true, 'Entry date is required'],
      default: Date.now,
      index: true
    },
    daysSinceOnset: {
      type: Number,
      required: [true, 'Days since onset is required'],
      min: 0
    },
    
    // Severity tracking
    severity: {
      level: {
        type: String,
        enum: ['None', 'Mild', 'Moderate', 'Severe', 'Life-threatening'],
        required: [true, 'Severity level is required']
      },
      numericScore: {
        type: Number,
        min: 0,
        max: 10,
        required: [true, 'Numeric severity score is required']
      },
      description: {
        type: String,
        maxlength: [300, 'Severity description cannot exceed 300 characters']
      }
    },
    
    // Frequency and pattern
    frequency: {
      type: String,
      enum: ['Constant', 'Frequent', 'Occasional', 'Rare', 'Intermittent', 'Once'],
      required: [true, 'Frequency is required']
    },
    pattern: {
      type: String,
      enum: ['Improving', 'Worsening', 'Stable', 'Fluctuating', 'Resolved'],
      required: [true, 'Pattern is required']
    },
    
    // Impact assessment
    functionalImpact: {
      daily_activities: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      },
      work_performance: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      },
      sleep_quality: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      },
      social_activities: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      },
      mood: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
      }
    },
    
    // Measurements (if applicable)
    measurements: {
      vital_signs: {
        blood_pressure: {
          systolic: Number,
          diastolic: Number,
          unit: {
            type: String,
            default: 'mmHg'
          }
        },
        heart_rate: {
          value: Number,
          unit: {
            type: String,
            default: 'bpm'
          }
        },
        temperature: {
          value: Number,
          unit: {
            type: String,
            enum: ['C', 'F'],
            default: 'C'
          }
        },
        oxygen_saturation: {
          value: Number,
          unit: {
            type: String,
            default: '%'
          }
        }
      },
      physical_measurements: {
        pain_scale: {
          value: Number,
          scale: {
            type: String,
            enum: ['0-10', 'faces', 'visual_analog'],
            default: '0-10'
          }
        },
        rash_area: {
          percentage: Number,
          description: String
        },
        swelling: {
          severity: {
            type: String,
            enum: ['None', 'Mild', 'Moderate', 'Severe']
          },
          location: String
        }
      },
      custom_measurements: [{
        name: String,
        value: Number,
        unit: String,
        notes: String
      }]
    },
    
    // Associated factors
    triggers: [{
      type: {
        type: String,
        enum: ['Medication', 'Food', 'Activity', 'Weather', 'Stress', 'Time of day', 'Other']
      },
      description: String,
      confidence: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
      }
    }],
    
    relievingFactors: [{
      type: {
        type: String,
        enum: ['Medication', 'Rest', 'Activity', 'Position change', 'Temperature', 'Other']
      },
      description: String,
      effectiveness: {
        type: String,
        enum: ['Very effective', 'Somewhat effective', 'Not effective'],
        default: 'Somewhat effective'
      }
    }],
    
    // Treatment and interventions
    interventions: [{
      type: {
        type: String,
        enum: ['Medication', 'Procedure', 'Therapy', 'Lifestyle change', 'Monitoring', 'Other']
      },
      name: String,
      dosage: String,
      startDate: Date,
      endDate: Date,
      effectiveness: {
        type: String,
        enum: ['Very effective', 'Somewhat effective', 'Not effective', 'Too early to tell'],
        default: 'Too early to tell'
      },
      sideEffects: String
    }],
    
    // Notes and observations
    notes: {
      patient_notes: {
        type: String,
        maxlength: [1000, 'Patient notes cannot exceed 1000 characters']
      },
      clinician_notes: {
        type: String,
        maxlength: [1000, 'Clinician notes cannot exceed 1000 characters']
      },
      caregiver_notes: {
        type: String,
        maxlength: [500, 'Caregiver notes cannot exceed 500 characters']
      }
    },
    
    // Entry metadata
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Entered by is required']
    },
    entryMethod: {
      type: String,
      enum: ['Manual', 'AI-assisted', 'Imported', 'Mobile app', 'Wearable device'],
      default: 'Manual'
    },
    dataSource: {
      type: String,
      enum: ['Patient', 'Healthcare provider', 'Caregiver', 'Medical records', 'Device'],
      required: [true, 'Data source is required']
    },
    confidence: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    }
  }],
  
  // Analytics and calculations
  analytics: {
    trendDirection: {
      type: String,
      enum: ['Improving', 'Worsening', 'Stable', 'Fluctuating', 'Resolved', 'Unknown'],
      default: 'Unknown'
    },
    averageSeverity: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    peakSeverity: {
      value: Number,
      date: Date
    },
    lowestSeverity: {
      value: Number,
      date: Date
    },
    totalEntries: {
      type: Number,
      default: 0
    },
    lastEntryDate: {
      type: Date,
      index: true
    },
    patternConsistency: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    improvementRate: {
      // Percentage improvement per day
      type: Number,
      default: 0
    }
  },
  
  // Alerts and notifications
  alerts: [{
    type: {
      type: String,
      enum: ['Severity increase', 'Duration concern', 'Pattern change', 'Missing data', 'Intervention needed'],
      required: true
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    triggeredDate: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedDate: Date,
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedDate: Date
  }],
  
  // Status and tracking
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Chronic', 'Intermittent', 'Under investigation', 'Closed'],
    default: 'Active',
    index: true
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

// Indexes for performance
symptomProgressionSchema.index({ originalReport: 1, patient: 1 });
symptomProgressionSchema.index({ patient: 1, status: 1 });
symptomProgressionSchema.index({ medicine: 1, 'symptom.bodySystem': 1 });
symptomProgressionSchema.index({ 'timeline.startDate': 1, 'timeline.endDate': 1 });
symptomProgressionSchema.index({ 'progressionEntries.entryDate': -1 });
symptomProgressionSchema.index({ 'analytics.trendDirection': 1 });

// Compound indexes for complex queries
symptomProgressionSchema.index({ 
  patient: 1, 
  'symptom.name': 1, 
  'timeline.startDate': -1 
});

// Virtual to calculate current duration
symptomProgressionSchema.virtual('currentDuration').get(function() {
  const startDate = this.timeline.startDate;
  const endDate = this.timeline.endDate || new Date();
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual to get the latest entry
symptomProgressionSchema.virtual('latestEntry').get(function() {
  if (this.progressionEntries.length === 0) return null;
  return this.progressionEntries[this.progressionEntries.length - 1];
});

// Virtual to get current severity
symptomProgressionSchema.virtual('currentSeverity').get(function() {
  const latest = this.latestEntry;
  return latest ? latest.severity.level : 'Unknown';
});

// Virtual to check if symptom needs attention
symptomProgressionSchema.virtual('needsAttention').get(function() {
  const latest = this.latestEntry;
  if (!latest) return false;
  
  // Check for concerning patterns
  const highSeverity = ['Severe', 'Life-threatening'].includes(latest.severity.level);
  const worsening = latest.pattern === 'Worsening';
  const longDuration = this.currentDuration > 30; // More than 30 days
  
  return highSeverity || worsening || longDuration;
});

// Pre-save middleware to update analytics
symptomProgressionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.progressionEntries.length > 0) {
    this.calculateAnalytics();
    this.updateTimeline();
    this.checkForAlerts();
  }
  
  next();
});

// Method to add a new progression entry
symptomProgressionSchema.methods.addProgressionEntry = function(entryData) {
  // Calculate days since onset
  const daysSinceOnset = Math.ceil(
    (new Date(entryData.entryDate || Date.now()) - this.timeline.startDate) / 
    (1000 * 60 * 60 * 24)
  );
  
  entryData.daysSinceOnset = daysSinceOnset;
  
  this.progressionEntries.push(entryData);
  this.calculateAnalytics();
  this.updateTimeline();
  
  return this.save();
};

// Method to calculate analytics
symptomProgressionSchema.methods.calculateAnalytics = function() {
  const entries = this.progressionEntries;
  if (entries.length === 0) return;
  
  // Calculate averages
  const severityScores = entries.map(e => e.severity.numericScore);
  this.analytics.averageSeverity = severityScores.reduce((a, b) => a + b, 0) / severityScores.length;
  
  // Find peak and lowest severity
  const maxSeverity = Math.max(...severityScores);
  const minSeverity = Math.min(...severityScores);
  
  const peakEntry = entries.find(e => e.severity.numericScore === maxSeverity);
  const lowestEntry = entries.find(e => e.severity.numericScore === minSeverity);
  
  this.analytics.peakSeverity = {
    value: maxSeverity,
    date: peakEntry.entryDate
  };
  
  this.analytics.lowestSeverity = {
    value: minSeverity,
    date: lowestEntry.entryDate
  };
  
  // Calculate trend direction
  this.analytics.trendDirection = this.calculateTrendDirection();
  
  // Update totals
  this.analytics.totalEntries = entries.length;
  this.analytics.lastEntryDate = entries[entries.length - 1].entryDate;
  
  // Calculate improvement rate
  if (entries.length > 1) {
    const firstScore = entries[0].severity.numericScore;
    const lastScore = entries[entries.length - 1].severity.numericScore;
    const daysDiff = entries[entries.length - 1].daysSinceOnset - entries[0].daysSinceOnset;
    
    if (daysDiff > 0) {
      this.analytics.improvementRate = ((firstScore - lastScore) / firstScore) * 100 / daysDiff;
    }
  }
};

// Method to calculate trend direction
symptomProgressionSchema.methods.calculateTrendDirection = function() {
  const entries = this.progressionEntries;
  if (entries.length < 2) return 'Unknown';
  
  const recent = entries.slice(-3); // Last 3 entries
  const scores = recent.map(e => e.severity.numericScore);
  
  // Simple trend calculation
  let improvements = 0;
  let worsenings = 0;
  
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] < scores[i-1]) improvements++;
    else if (scores[i] > scores[i-1]) worsenings++;
  }
  
  if (improvements > worsenings) return 'Improving';
  if (worsenings > improvements) return 'Worsening';
  
  // Check if resolved
  const latestScore = scores[scores.length - 1];
  if (latestScore === 0) return 'Resolved';
  
  return 'Stable';
};

// Method to update timeline
symptomProgressionSchema.methods.updateTimeline = function() {
  const entries = this.progressionEntries;
  if (entries.length === 0) return;
  
  const latestEntry = entries[entries.length - 1];
  
  // Check if resolved
  if (latestEntry.severity.level === 'None' || latestEntry.pattern === 'Resolved') {
    this.timeline.endDate = latestEntry.entryDate;
    this.timeline.isOngoing = false;
    this.status = 'Resolved';
  }
  
  // Update total duration
  const endDate = this.timeline.endDate || new Date();
  this.timeline.totalDuration = Math.ceil(
    (endDate - this.timeline.startDate) / (1000 * 60 * 60 * 24)
  );
};

// Method to check for alerts
symptomProgressionSchema.methods.checkForAlerts = function() {
  const entries = this.progressionEntries;
  if (entries.length === 0) return;
  
  const latestEntry = entries[entries.length - 1];
  const currentAlerts = this.alerts.filter(a => !a.resolved);
  
  // Check for severity increase
  if (entries.length > 1) {
    const previousEntry = entries[entries.length - 2];
    if (latestEntry.severity.numericScore > previousEntry.severity.numericScore + 2) {
      // Only add if not already alerted
      const existingSeverityAlert = currentAlerts.find(a => a.type === 'Severity increase');
      if (!existingSeverityAlert) {
        this.alerts.push({
          type: 'Severity increase',
          severity: 'High',
          message: `Symptom severity increased from ${previousEntry.severity.level} to ${latestEntry.severity.level}`,
          triggeredDate: new Date()
        });
      }
    }
  }
  
  // Check for long duration
  if (this.currentDuration > 30 && this.status === 'Active') {
    const existingDurationAlert = currentAlerts.find(a => a.type === 'Duration concern');
    if (!existingDurationAlert) {
      this.alerts.push({
        type: 'Duration concern',
        severity: 'Medium',
        message: `Symptom has persisted for ${this.currentDuration} days`,
        triggeredDate: new Date()
      });
    }
  }
  
  // Check for high severity
  if (['Severe', 'Life-threatening'].includes(latestEntry.severity.level)) {
    const existingHighSeverityAlert = currentAlerts.find(a => a.type === 'Intervention needed');
    if (!existingHighSeverityAlert) {
      this.alerts.push({
        type: 'Intervention needed',
        severity: 'Critical',
        message: `Symptom severity is ${latestEntry.severity.level} - immediate attention may be required`,
        triggeredDate: new Date()
      });
    }
  }
};

// Static method to find progressions by patient
symptomProgressionSchema.statics.findByPatient = function(patientId, options = {}) {
  const query = { 
    patient: patientId, 
    isActive: true, 
    isDeleted: false 
  };
  
  if (options.status) query.status = options.status;
  if (options.bodySystem) query['symptom.bodySystem'] = options.bodySystem;
  
  return this.find(query)
    .populate('originalReport medicine patient')
    .sort({ 'timeline.startDate': -1 });
};

// Static method to find active progressions needing attention
symptomProgressionSchema.statics.findNeedingAttention = function() {
  return this.find({
    status: 'Active',
    isActive: true,
    isDeleted: false,
    $or: [
      { 'alerts.resolved': false },
      { 'analytics.trendDirection': 'Worsening' }
    ]
  }).populate('originalReport medicine patient');
};

// Static method to get progression statistics
symptomProgressionSchema.statics.getProgressionStats = function(filters = {}) {
  const matchStage = {
    isActive: true,
    isDeleted: false,
    ...filters
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalProgressions: { $sum: 1 },
        activeProgressions: {
          $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
        },
        resolvedProgressions: {
          $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
        },
        averageDuration: { $avg: '$timeline.totalDuration' },
        averageSeverity: { $avg: '$analytics.averageSeverity' },
        needingAttention: {
          $sum: { $cond: [{ $gt: [{ $size: '$alerts' }, 0] }, 1, 0] }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('SymptomProgression', symptomProgressionSchema);