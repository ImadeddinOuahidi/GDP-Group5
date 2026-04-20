/**
 * Symptom Progression Service
 * Handles all business logic for symptom progression tracking, analytics, and management
 */

const SymptomProgression = require('../models/SymptomProgression');
const ReportSideEffect = require('../models/ReportSideEffect');
const Medication = require('../models/Medication');
const User = require('../models/User');

class SymptomProgressionService {
  
  /**
   * Create a new symptom progression tracking from an existing side effect report
   * @param {Object} reportData - Original side effect report data
   * @param {Object} symptomData - Specific symptom to track
   * @param {String} patientId - Patient ID
   * @returns {Object} Created symptom progression
   */
  async createProgressionFromReport(reportData, symptomData, patientId) {
    try {
      // Validate that the original report exists
      const originalReport = await ReportSideEffect.findById(reportData.reportId);
      if (!originalReport) {
        throw new Error('Original side effect report not found');
      }

      // Find the specific side effect from the report
      const sideEffect = originalReport.sideEffects.find(
        se => se._id.toString() === symptomData.sideEffectId
      );
      
      if (!sideEffect) {
        throw new Error('Side effect not found in the original report');
      }

      // Create initial progression entry based on the original report
      const initialEntry = {
        entryDate: originalReport.reportDetails.incidentDate,
        daysSinceOnset: 0,
        severity: {
          level: sideEffect.severity,
          numericScore: this.severityToNumeric(sideEffect.severity),
          description: sideEffect.description || ''
        },
        frequency: sideEffect.frequency || 'Unknown',
        pattern: 'Stable', // Initial assumption
        functionalImpact: {
          daily_activities: symptomData.initialImpact?.daily_activities || 0,
          work_performance: symptomData.initialImpact?.work_performance || 0,
          sleep_quality: symptomData.initialImpact?.sleep_quality || 0,
          social_activities: symptomData.initialImpact?.social_activities || 0,
          mood: symptomData.initialImpact?.mood || 0
        },
        notes: {
          patient_notes: symptomData.notes || '',
          clinician_notes: originalReport.causalityAssessment?.comments || ''
        },
        enteredBy: patientId,
        entryMethod: 'Manual',
        dataSource: 'Patient',
        confidence: 'High'
      };

      const progressionData = {
        originalReport: reportData.reportId,
        patient: patientId,
        medicine: originalReport.medicine,
        symptom: {
          originalSideEffectId: sideEffect._id,
          name: sideEffect.effect,
          description: sideEffect.description,
          bodySystem: sideEffect.bodySystem
        },
        timeline: {
          startDate: originalReport.reportDetails.incidentDate,
          isOngoing: true
        },
        progressionEntries: [initialEntry],
        status: 'Active'
      };

      const progression = new SymptomProgression(progressionData);
      await progression.save();

      return await this.getProgressionById(progression._id);
    } catch (error) {
      console.error('Create progression from report error:', error);
      throw new Error(`Failed to create symptom progression: ${error.message}`);
    }
  }

  /**
   * Add a new progression entry to an existing symptom progression
   * @param {String} progressionId - Progression ID
   * @param {Object} entryData - New progression entry data
   * @returns {Object} Updated symptom progression
   */
  async addProgressionEntry(progressionId, entryData) {
    try {
      const progression = await SymptomProgression.findById(progressionId);
      if (!progression) {
        throw new Error('Symptom progression not found');
      }

      // Validate and enhance entry data
      const enhancedEntry = await this.validateAndEnhanceEntry(entryData, progression);
      
      // Add the entry using the model method
      await progression.addProgressionEntry(enhancedEntry);

      return await this.getProgressionById(progressionId);
    } catch (error) {
      console.error('Add progression entry error:', error);
      throw new Error(`Failed to add progression entry: ${error.message}`);
    }
  }

  /**
   * Get symptom progression by ID with full population
   * @param {String} progressionId - Progression ID
   * @returns {Object} Symptom progression with populated data
   */
  async getProgressionById(progressionId) {
    try {
      const progression = await SymptomProgression.findById(progressionId)
        .populate('originalReport')
        .populate('medicine', 'name genericName category dosageForm')
        .populate('patient', 'firstName lastName email')
        .populate('progressionEntries.enteredBy', 'firstName lastName role');

      if (!progression || progression.isDeleted) {
        throw new Error('Symptom progression not found');
      }

      return this.enhanceProgressionData(progression);
    } catch (error) {
      console.error('Get progression by ID error:', error);
      throw new Error(`Failed to retrieve progression: ${error.message}`);
    }
  }

  /**
   * Get all symptom progressions for a patient
   * @param {String} patientId - Patient ID
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of symptom progressions
   */
  async getProgressionsByPatient(patientId, filters = {}) {
    try {
      const progressions = await SymptomProgression.findByPatient(patientId, filters);
      
      return progressions.map(progression => this.enhanceProgressionData(progression));
    } catch (error) {
      console.error('Get progressions by patient error:', error);
      throw new Error(`Failed to retrieve patient progressions: ${error.message}`);
    }
  }

  /**
   * Get symptom progressions needing attention
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of progressions needing attention
   */
  async getProgressionsNeedingAttention(filters = {}) {
    try {
      let query = SymptomProgression.findNeedingAttention();
      
      // Apply additional filters
      if (filters.severity) {
        query = query.where('progressionEntries.severity.level').equals(filters.severity);
      }
      
      if (filters.bodySystem) {
        query = query.where('symptom.bodySystem').equals(filters.bodySystem);
      }
      
      if (filters.duration) {
        const minDuration = parseInt(filters.duration);
        query = query.where('timeline.totalDuration').gte(minDuration);
      }

      const progressions = await query.exec();
      
      return progressions.map(progression => this.enhanceProgressionData(progression));
    } catch (error) {
      console.error('Get progressions needing attention error:', error);
      throw new Error(`Failed to retrieve progressions needing attention: ${error.message}`);
    }
  }

  /**
   * Update symptom progression status
   * @param {String} progressionId - Progression ID
   * @param {String} newStatus - New status
   * @param {String} userId - User making the change
   * @returns {Object} Updated progression
   */
  async updateProgressionStatus(progressionId, newStatus, userId) {
    try {
      const progression = await SymptomProgression.findById(progressionId);
      if (!progression) {
        throw new Error('Symptom progression not found');
      }

      progression.status = newStatus;
      
      // If marking as resolved, set end date
      if (newStatus === 'Resolved' && progression.timeline.isOngoing) {
        progression.timeline.endDate = new Date();
        progression.timeline.isOngoing = false;
      }

      await progression.save();

      return await this.getProgressionById(progressionId);
    } catch (error) {
      console.error('Update progression status error:', error);
      throw new Error(`Failed to update progression status: ${error.message}`);
    }
  }

  /**
   * Acknowledge alerts for a symptom progression
   * @param {String} progressionId - Progression ID
   * @param {Array} alertIds - Array of alert IDs to acknowledge
   * @param {String} userId - User acknowledging the alerts
   * @returns {Object} Updated progression
   */
  async acknowledgeAlerts(progressionId, alertIds, userId) {
    try {
      const progression = await SymptomProgression.findById(progressionId);
      if (!progression) {
        throw new Error('Symptom progression not found');
      }

      // Acknowledge specified alerts
      progression.alerts.forEach(alert => {
        if (alertIds.includes(alert._id.toString()) && !alert.acknowledged) {
          alert.acknowledged = true;
          alert.acknowledgedBy = userId;
          alert.acknowledgedDate = new Date();
        }
      });

      await progression.save();

      return await this.getProgressionById(progressionId);
    } catch (error) {
      console.error('Acknowledge alerts error:', error);
      throw new Error(`Failed to acknowledge alerts: ${error.message}`);
    }
  }

  /**
   * Get progression analytics and statistics
   * @param {Object} filters - Filters for analytics
   * @returns {Object} Analytics data
   */
  async getProgressionAnalytics(filters = {}) {
    try {
      // Get basic statistics
      const basicStats = await SymptomProgression.getProgressionStats(filters);
      
      // Get trending data
      const trendingData = await this.getTrendingSymptoms(filters);
      
      // Get severity distribution
      const severityDistribution = await this.getSeverityDistribution(filters);
      
      // Get duration patterns
      const durationPatterns = await this.getDurationPatterns(filters);
      
      // Get body system analysis
      const bodySystemAnalysis = await this.getBodySystemAnalysis(filters);

      return {
        basicStats: basicStats[0] || {},
        trending: trendingData,
        severityDistribution,
        durationPatterns,
        bodySystemAnalysis,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Get progression analytics error:', error);
      throw new Error(`Failed to generate analytics: ${error.message}`);
    }
  }

  /**
   * Search symptom progressions with advanced filters
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search results with pagination
   */
  async searchProgressions(searchParams) {
    try {
      const {
        query,
        patientId,
        medicineId,
        bodySystem,
        severity,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        sortBy = 'timeline.startDate',
        sortOrder = 'desc'
      } = searchParams;

      // Build the search query
      const searchQuery = {
        isActive: true,
        isDeleted: false
      };

      if (patientId) searchQuery.patient = patientId;
      if (medicineId) searchQuery.medicine = medicineId;
      if (bodySystem) searchQuery['symptom.bodySystem'] = bodySystem;
      if (status) searchQuery.status = status;
      
      if (query) {
        searchQuery.$or = [
          { 'symptom.name': new RegExp(query, 'i') },
          { 'symptom.description': new RegExp(query, 'i') }
        ];
      }

      if (startDate || endDate) {
        searchQuery['timeline.startDate'] = {};
        if (startDate) searchQuery['timeline.startDate'].$gte = new Date(startDate);
        if (endDate) searchQuery['timeline.startDate'].$lte = new Date(endDate);
      }

      // Handle severity filtering (check latest entry)
      if (severity) {
        searchQuery['progressionEntries.severity.level'] = severity;
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [progressions, total] = await Promise.all([
        SymptomProgression.find(searchQuery)
          .populate('originalReport medicine patient')
          .populate('progressionEntries.enteredBy', 'firstName lastName role')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        SymptomProgression.countDocuments(searchQuery)
      ]);

      return {
        progressions: progressions.map(p => this.enhanceProgressionData(p)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Search progressions error:', error);
      throw new Error(`Failed to search progressions: ${error.message}`);
    }
  }

  /**
   * Generate progression report for a patient or medicine
   * @param {Object} reportParams - Report parameters
   * @returns {Object} Comprehensive progression report
   */
  async generateProgressionReport(reportParams) {
    try {
      const { type, entityId, startDate, endDate, includeAnalytics = true } = reportParams;
      
      let filters = {};
      
      if (type === 'patient') {
        filters.patient = entityId;
      } else if (type === 'medicine') {
        filters.medicine = entityId;
      }

      if (startDate) filters['timeline.startDate'] = { $gte: new Date(startDate) };
      if (endDate) {
        filters['timeline.startDate'] = { 
          ...filters['timeline.startDate'], 
          $lte: new Date(endDate) 
        };
      }

      // Get progressions
      const progressions = await SymptomProgression.find(filters)
        .populate('originalReport medicine patient')
        .sort({ 'timeline.startDate': -1 });

      // Generate summary
      const summary = this.generateProgressionSummary(progressions);
      
      // Get analytics if requested
      let analytics = null;
      if (includeAnalytics) {
        analytics = await this.getProgressionAnalytics(filters);
      }

      return {
        reportType: type,
        entityId,
        dateRange: { startDate, endDate },
        summary,
        progressions: progressions.map(p => this.enhanceProgressionData(p)),
        analytics,
        generatedAt: new Date(),
        totalProgressions: progressions.length
      };
    } catch (error) {
      console.error('Generate progression report error:', error);
      throw new Error(`Failed to generate progression report: ${error.message}`);
    }
  }

  // Helper methods

  /**
   * Convert severity level to numeric score
   * @param {String} severity - Severity level
   * @returns {Number} Numeric score
   */
  severityToNumeric(severity) {
    const severityMap = {
      'None': 0,
      'Mild': 2.5,
      'Moderate': 5,
      'Severe': 7.5,
      'Life-threatening': 10
    };
    
    return severityMap[severity] || 0;
  }

  /**
   * Validate and enhance progression entry data
   * @param {Object} entryData - Raw entry data
   * @param {Object} progression - Progression document
   * @returns {Object} Enhanced entry data
   */
  async validateAndEnhanceEntry(entryData, progression) {
    // Convert severity to numeric if not provided
    if (entryData.severity && !entryData.severity.numericScore) {
      entryData.severity.numericScore = this.severityToNumeric(entryData.severity.level);
    }

    // Set default values
    entryData.entryDate = entryData.entryDate || new Date();
    entryData.entryMethod = entryData.entryMethod || 'Manual';
    entryData.dataSource = entryData.dataSource || 'Patient';
    entryData.confidence = entryData.confidence || 'Medium';

    // Initialize functional impact if not provided
    if (!entryData.functionalImpact) {
      entryData.functionalImpact = {
        daily_activities: 0,
        work_performance: 0,
        sleep_quality: 0,
        social_activities: 0,
        mood: 0
      };
    }

    return entryData;
  }

  /**
   * Enhance progression data with calculated fields
   * @param {Object} progression - Progression document
   * @returns {Object} Enhanced progression data
   */
  enhanceProgressionData(progression) {
    const progressionObj = progression.toObject();
    
    // Add calculated fields
    progressionObj.currentDuration = progression.currentDuration;
    progressionObj.latestEntry = progression.latestEntry;
    progressionObj.currentSeverity = progression.currentSeverity;
    progressionObj.needsAttention = progression.needsAttention;
    
    // Add trend analysis
    if (progressionObj.progressionEntries.length > 1) {
      progressionObj.trendAnalysis = this.analyzeTrend(progressionObj.progressionEntries);
    }
    
    // Add active alerts count
    progressionObj.activeAlertsCount = progressionObj.alerts.filter(a => !a.acknowledged || !a.resolved).length;
    
    return progressionObj;
  }

  /**
   * Analyze trend from progression entries
   * @param {Array} entries - Progression entries
   * @returns {Object} Trend analysis
   */
  analyzeTrend(entries) {
    if (entries.length < 2) return null;
    
    const recent = entries.slice(-5); // Last 5 entries
    const scores = recent.map(e => e.severity.numericScore);
    
    // Calculate trend slope
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = scores.length;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += scores[i];
      sumXY += i * scores[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Determine trend direction and strength
    let direction, strength;
    
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
      strength = 'weak';
    } else if (slope < 0) {
      direction = 'improving';
      strength = Math.abs(slope) > 0.5 ? 'strong' : 'moderate';
    } else {
      direction = 'worsening';
      strength = slope > 0.5 ? 'strong' : 'moderate';
    }
    
    return {
      direction,
      strength,
      slope,
      confidence: n >= 5 ? 'high' : 'medium'
    };
  }

  /**
   * Get trending symptoms across all progressions
   * @param {Object} filters - Filters for trending analysis
   * @returns {Array} Trending symptoms data
   */
  async getTrendingSymptoms(filters = {}) {
    try {
      const matchStage = {
        isActive: true,
        isDeleted: false,
        ...filters
      };

      return await SymptomProgression.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              symptomName: '$symptom.name',
              bodySystem: '$symptom.bodySystem'
            },
            count: { $sum: 1 },
            avgSeverity: { $avg: '$analytics.averageSeverity' },
            avgDuration: { $avg: '$timeline.totalDuration' },
            worseningCount: {
              $sum: { $cond: [{ $eq: ['$analytics.trendDirection', 'Worsening'] }, 1, 0] }
            },
            improvingCount: {
              $sum: { $cond: [{ $eq: ['$analytics.trendDirection', 'Improving'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            worseningRate: { $divide: ['$worseningCount', '$count'] },
            improvementRate: { $divide: ['$improvingCount', '$count'] }
          }
        },
        { $sort: { count: -1, avgSeverity: -1 } },
        { $limit: 20 }
      ]);
    } catch (error) {
      console.error('Get trending symptoms error:', error);
      return [];
    }
  }

  /**
   * Get severity distribution analytics
   * @param {Object} filters - Filters for analysis
   * @returns {Array} Severity distribution data
   */
  async getSeverityDistribution(filters = {}) {
    try {
      const matchStage = {
        isActive: true,
        isDeleted: false,
        ...filters
      };

      return await SymptomProgression.aggregate([
        { $match: matchStage },
        { $unwind: '$progressionEntries' },
        {
          $group: {
            _id: '$progressionEntries.severity.level',
            count: { $sum: 1 },
            avgNumericScore: { $avg: '$progressionEntries.severity.numericScore' }
          }
        },
        { $sort: { avgNumericScore: 1 } }
      ]);
    } catch (error) {
      console.error('Get severity distribution error:', error);
      return [];
    }
  }

  /**
   * Get duration patterns analytics
   * @param {Object} filters - Filters for analysis
   * @returns {Object} Duration patterns data
   */
  async getDurationPatterns(filters = {}) {
    try {
      const matchStage = {
        isActive: true,
        isDeleted: false,
        ...filters
      };

      const results = await SymptomProgression.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            shortTerm: { $sum: { $cond: [{ $lte: ['$timeline.totalDuration', 7] }, 1, 0] } },
            mediumTerm: { 
              $sum: { 
                $cond: [
                  { $and: [{ $gt: ['$timeline.totalDuration', 7] }, { $lte: ['$timeline.totalDuration', 30] }] }, 
                  1, 
                  0
                ] 
              } 
            },
            longTerm: { $sum: { $cond: [{ $gt: ['$timeline.totalDuration', 30] }, 1, 0] } },
            avgDuration: { $avg: '$timeline.totalDuration' },
            maxDuration: { $max: '$timeline.totalDuration' },
            total: { $sum: 1 }
          }
        }
      ]);

      return results[0] || {
        shortTerm: 0,
        mediumTerm: 0,
        longTerm: 0,
        avgDuration: 0,
        maxDuration: 0,
        total: 0
      };
    } catch (error) {
      console.error('Get duration patterns error:', error);
      return {};
    }
  }

  /**
   * Get body system analysis
   * @param {Object} filters - Filters for analysis
   * @returns {Array} Body system analysis data
   */
  async getBodySystemAnalysis(filters = {}) {
    try {
      const matchStage = {
        isActive: true,
        isDeleted: false,
        ...filters
      };

      return await SymptomProgression.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$symptom.bodySystem',
            count: { $sum: 1 },
            avgSeverity: { $avg: '$analytics.averageSeverity' },
            avgDuration: { $avg: '$timeline.totalDuration' },
            activeCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
            },
            resolvedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            resolutionRate: { $divide: ['$resolvedCount', '$count'] }
          }
        },
        { $sort: { count: -1 } }
      ]);
    } catch (error) {
      console.error('Get body system analysis error:', error);
      return [];
    }
  }

  /**
   * Generate progression summary
   * @param {Array} progressions - Array of progressions
   * @returns {Object} Summary data
   */
  generateProgressionSummary(progressions) {
    const total = progressions.length;
    const active = progressions.filter(p => p.status === 'Active').length;
    const resolved = progressions.filter(p => p.status === 'Resolved').length;
    const chronic = progressions.filter(p => p.status === 'Chronic').length;
    
    const durations = progressions.map(p => p.timeline.totalDuration).filter(d => d > 0);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    const severities = progressions
      .map(p => p.analytics?.averageSeverity)
      .filter(s => s !== undefined && s !== null);
    const avgSeverity = severities.length > 0 ? severities.reduce((a, b) => a + b, 0) / severities.length : 0;
    
    const needingAttention = progressions.filter(p => 
      p.alerts && p.alerts.some(a => !a.acknowledged || !a.resolved)
    ).length;

    return {
      total,
      active,
      resolved,
      chronic,
      needingAttention,
      avgDuration: Math.round(avgDuration * 100) / 100,
      avgSeverity: Math.round(avgSeverity * 100) / 100,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
    };
  }
}

module.exports = new SymptomProgressionService();