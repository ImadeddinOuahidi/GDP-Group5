/**
 * Symptom Progression Analytics Utilities
 * Provides advanced analytics and visualization data for symptom progression tracking
 */

const SymptomProgression = require('../models/SymptomProgression');
const Medication = require('../models/Medication');

class SymptomProgressionAnalytics {

  /**
   * Generate comprehensive dashboard analytics
   * @param {Object} filters - Analytics filters
   * @returns {Object} Dashboard analytics data
   */
  async generateDashboardAnalytics(filters = {}) {
    try {
      const [
        overviewStats,
        severityTrends,
        bodySystemAnalysis,
        medicineImpactAnalysis,
        resolutionPatterns,
        alertSummary,
        timeSeriesData
      ] = await Promise.all([
        this.getOverviewStatistics(filters),
        this.getSeverityTrends(filters),
        this.getBodySystemAnalysis(filters),
        this.getMedicineImpactAnalysis(filters),
        this.getResolutionPatterns(filters),
        this.getAlertSummary(filters),
        this.getTimeSeriesData(filters)
      ]);

      return {
        overview: overviewStats,
        severityTrends,
        bodySystemAnalysis,
        medicineImpactAnalysis,
        resolutionPatterns,
        alerts: alertSummary,
        timeSeries: timeSeriesData,
        generatedAt: new Date(),
        filters
      };
    } catch (error) {
      console.error('Generate dashboard analytics error:', error);
      throw new Error('Failed to generate dashboard analytics');
    }
  }

  /**
   * Get overview statistics
   * @param {Object} filters - Filters for statistics
   * @returns {Object} Overview statistics
   */
  async getOverviewStatistics(filters = {}) {
    const matchStage = {
      isActive: true,
      isDeleted: false,
      ...filters
    };

    const [
      totalStats,
      recentActivity,
      severityBreakdown
    ] = await Promise.all([
      SymptomProgression.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            chronic: { $sum: { $cond: [{ $eq: ['$status', 'Chronic'] }, 1, 0] } },
            avgDuration: { $avg: '$timeline.totalDuration' },
            avgSeverity: { $avg: '$analytics.averageSeverity' },
            withAlerts: { $sum: { $cond: [{ $gt: [{ $size: '$alerts' }, 0] }, 1, 0] } }
          }
        }
      ]),
      
      // Recent activity (last 30 days)
      SymptomProgression.aggregate([
        {
          $match: {
            ...matchStage,
            'timeline.startDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        { $count: 'recentCount' }
      ]),
      
      // Current severity breakdown
      SymptomProgression.aggregate([
        { $match: { ...matchStage, status: 'Active' } },
        { $unwind: '$progressionEntries' },
        {
          $group: {
            _id: '$_id',
            latestEntry: { $last: '$progressionEntries' }
          }
        },
        {
          $group: {
            _id: '$latestEntry.severity.level',
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    const stats = totalStats[0] || {};
    const recentCount = recentActivity[0]?.recentCount || 0;

    return {
      total: stats.total || 0,
      active: stats.active || 0,
      resolved: stats.resolved || 0,
      chronic: stats.chronic || 0,
      recentActivity: recentCount,
      averageDuration: Math.round((stats.avgDuration || 0) * 100) / 100,
      averageSeverity: Math.round((stats.avgSeverity || 0) * 100) / 100,
      withAlerts: stats.withAlerts || 0,
      resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
      currentSeverityBreakdown: severityBreakdown
    };
  }

  /**
   * Get severity trends over time
   * @param {Object} filters - Filters for trends
   * @returns {Array} Severity trends data
   */
  async getSeverityTrends(filters = {}) {
    const matchStage = {
      isActive: true,
      isDeleted: false,
      ...filters
    };

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return await SymptomProgression.aggregate([
      { $match: matchStage },
      { $unwind: '$progressionEntries' },
      {
        $match: {
          'progressionEntries.entryDate': { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$progressionEntries.entryDate'
              }
            },
            severity: '$progressionEntries.severity.level'
          },
          count: { $sum: 1 },
          avgNumericScore: { $avg: '$progressionEntries.severity.numericScore' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          severityData: {
            $push: {
              severity: '$_id.severity',
              count: '$count',
              avgScore: '$avgNumericScore'
            }
          },
          totalEntries: { $sum: '$count' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
  }

  /**
   * Get body system analysis
   * @param {Object} filters - Filters for analysis
   * @returns {Array} Body system analysis data
   */
  async getBodySystemAnalysis(filters = {}) {
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
          totalProgressions: { $sum: 1 },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          chronicCount: { $sum: { $cond: [{ $eq: ['$status', 'Chronic'] }, 1, 0] } },
          avgDuration: { $avg: '$timeline.totalDuration' },
          avgSeverity: { $avg: '$analytics.averageSeverity' },
          worseningTrend: {
            $sum: { $cond: [{ $eq: ['$analytics.trendDirection', 'Worsening'] }, 1, 0] }
          },
          improvingTrend: {
            $sum: { $cond: [{ $eq: ['$analytics.trendDirection', 'Improving'] }, 1, 0] }
          },
          alertCount: { $sum: { $size: '$alerts' } }
        }
      },
      {
        $addFields: {
          resolutionRate: {
            $multiply: [
              { $divide: ['$resolvedCount', '$totalProgressions'] },
              100
            ]
          },
          worseningRate: {
            $multiply: [
              { $divide: ['$worseningTrend', '$totalProgressions'] },
              100
            ]
          }
        }
      },
      { $sort: { totalProgressions: -1 } }
    ]);
  }

  /**
   * Get medicine impact analysis
   * @param {Object} filters - Filters for analysis
   * @returns {Array} Medicine impact analysis data
   */
  async getMedicineImpactAnalysis(filters = {}) {
    const matchStage = {
      isActive: true,
      isDeleted: false,
      ...filters
    };

    const medicineAnalysis = await SymptomProgression.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicineDetails'
        }
      },
      { $unwind: '$medicineDetails' },
      {
        $group: {
          _id: '$medicine',
          medicineName: { $first: '$medicineDetails.name' },
          genericName: { $first: '$medicineDetails.genericName' },
          category: { $first: '$medicineDetails.category' },
          totalProgressions: { $sum: 1 },
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
          avgDuration: { $avg: '$timeline.totalDuration' },
          avgSeverity: { $avg: '$analytics.averageSeverity' },
          severeSideEffects: {
            $sum: { $cond: [{ $gte: ['$analytics.averageSeverity', 7] }, 1, 0] }
          },
          chronicCases: { $sum: { $cond: [{ $eq: ['$status', 'Chronic'] }, 1, 0] } },
          symptomTypes: { $addToSet: '$symptom.name' }
        }
      },
      {
        $addFields: {
          resolutionRate: {
            $multiply: [
              { $divide: ['$resolvedCount', '$totalProgressions'] },
              100
            ]
          },
          severeRate: {
            $multiply: [
              { $divide: ['$severeSideEffects', '$totalProgressions'] },
              100
            ]
          },
          uniqueSymptoms: { $size: '$symptomTypes' }
        }
      },
      { $sort: { totalProgressions: -1 } },
      { $limit: 20 }
    ]);

    return medicineAnalysis;
  }

  /**
   * Get resolution patterns analysis
   * @param {Object} filters - Filters for analysis
   * @returns {Object} Resolution patterns data
   */
  async getResolutionPatterns(filters = {}) {
    const matchStage = {
      isActive: true,
      isDeleted: false,
      status: 'Resolved',
      ...filters
    };

    const [
      durationPatterns,
      resolutionByBodySystem,
      resolutionTimeline
    ] = await Promise.all([
      // Duration patterns for resolved cases
      SymptomProgression.aggregate([
        { $match: matchStage },
        {
          $bucket: {
            groupBy: '$timeline.totalDuration',
            boundaries: [0, 7, 14, 30, 60, 90, 180, 365, Infinity],
            default: 'other',
            output: {
              count: { $sum: 1 },
              avgSeverity: { $avg: '$analytics.averageSeverity' },
              symptoms: { $addToSet: '$symptom.name' }
            }
          }
        }
      ]),
      
      // Resolution rates by body system
      SymptomProgression.aggregate([
        {
          $match: {
            isActive: true,
            isDeleted: false,
            ...filters
          }
        },
        {
          $group: {
            _id: '$symptom.bodySystem',
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            resolutionRate: {
              $multiply: [{ $divide: ['$resolved', '$total'] }, 100]
            }
          }
        },
        { $sort: { resolutionRate: -1 } }
      ]),
      
      // Resolution timeline (last 90 days)
      SymptomProgression.aggregate([
        {
          $match: {
            ...matchStage,
            'timeline.endDate': { 
              $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) 
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timeline.endDate'
              }
            },
            count: { $sum: 1 },
            avgDuration: { $avg: '$timeline.totalDuration' }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    return {
      durationPatterns,
      resolutionByBodySystem,
      resolutionTimeline
    };
  }

  /**
   * Get alert summary
   * @param {Object} filters - Filters for alerts
   * @returns {Object} Alert summary data
   */
  async getAlertSummary(filters = {}) {
    const matchStage = {
      isActive: true,
      isDeleted: false,
      ...filters
    };

    const alertAnalysis = await SymptomProgression.aggregate([
      { $match: matchStage },
      { $unwind: '$alerts' },
      {
        $group: {
          _id: {
            type: '$alerts.type',
            severity: '$alerts.severity'
          },
          count: { $sum: 1 },
          acknowledged: {
            $sum: { $cond: ['$alerts.acknowledged', 1, 0] }
          },
          resolved: {
            $sum: { $cond: ['$alerts.resolved', 1, 0] }
          },
          recent: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$alerts.triggeredDate',
                    new Date(Date.now() - 24 * 60 * 60 * 1000)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          acknowledgmentRate: {
            $multiply: [{ $divide: ['$acknowledged', '$count'] }, 100]
          },
          resolutionRate: {
            $multiply: [{ $divide: ['$resolved', '$count'] }, 100]
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get total alert counts
    const totals = await SymptomProgression.aggregate([
      { $match: matchStage },
      {
        $project: {
          totalAlerts: { $size: '$alerts' },
          unacknowledgedAlerts: {
            $size: {
              $filter: {
                input: '$alerts',
                cond: { $eq: ['$$this.acknowledged', false] }
              }
            }
          },
          criticalAlerts: {
            $size: {
              $filter: {
                input: '$alerts',
                cond: { $eq: ['$$this.severity', 'Critical'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: '$totalAlerts' },
          unacknowledged: { $sum: '$unacknowledgedAlerts' },
          critical: { $sum: '$criticalAlerts' }
        }
      }
    ]);

    return {
      breakdown: alertAnalysis,
      totals: totals[0] || { totalAlerts: 0, unacknowledged: 0, critical: 0 }
    };
  }

  /**
   * Get time series data for charts
   * @param {Object} filters - Filters for time series
   * @returns {Object} Time series data
   */
  async getTimeSeriesData(filters = {}) {
    const matchStage = {
      isActive: true,
      isDeleted: false,
      ...filters
    };

    const last90Days = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [
      newProgressions,
      resolvedProgressions,
      severityTrends
    ] = await Promise.all([
      // New progressions over time
      SymptomProgression.aggregate([
        {
          $match: {
            ...matchStage,
            'timeline.startDate': { $gte: last90Days }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timeline.startDate'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Resolved progressions over time
      SymptomProgression.aggregate([
        {
          $match: {
            ...matchStage,
            status: 'Resolved',
            'timeline.endDate': { $gte: last90Days }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timeline.endDate'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      
      // Average severity trends
      SymptomProgression.aggregate([
        { $match: matchStage },
        { $unwind: '$progressionEntries' },
        {
          $match: {
            'progressionEntries.entryDate': { $gte: last90Days }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$progressionEntries.entryDate'
              }
            },
            avgSeverity: { $avg: '$progressionEntries.severity.numericScore' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    return {
      newProgressions,
      resolvedProgressions,
      severityTrends
    };
  }

  /**
   * Generate patient-specific analytics
   * @param {String} patientId - Patient ID
   * @returns {Object} Patient analytics data
   */
  async generatePatientAnalytics(patientId) {
    const patientFilter = { patient: patientId };
    
    const [
      patientOverview,
      symptomHistory,
      medicineAnalysis,
      progressionTimeline
    ] = await Promise.all([
      this.getOverviewStatistics(patientFilter),
      this.getPatientSymptomHistory(patientId),
      this.getPatientMedicineAnalysis(patientId),
      this.getPatientProgressionTimeline(patientId)
    ]);

    return {
      overview: patientOverview,
      symptomHistory,
      medicineAnalysis,
      timeline: progressionTimeline,
      patientId,
      generatedAt: new Date()
    };
  }

  /**
   * Get patient symptom history
   * @param {String} patientId - Patient ID
   * @returns {Array} Symptom history data
   */
  async getPatientSymptomHistory(patientId) {
    return await SymptomProgression.aggregate([
      {
        $match: {
          patient: patientId,
          isActive: true,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$symptom.name',
          occurrences: { $sum: 1 },
          bodySystem: { $first: '$symptom.bodySystem' },
          avgDuration: { $avg: '$timeline.totalDuration' },
          avgSeverity: { $avg: '$analytics.averageSeverity' },
          lastOccurrence: { $max: '$timeline.startDate' },
          statuses: { $addToSet: '$status' },
          medicines: { $addToSet: '$medicine' }
        }
      },
      { $sort: { occurrences: -1, lastOccurrence: -1 } }
    ]);
  }

  /**
   * Get patient medicine analysis
   * @param {String} patientId - Patient ID
   * @returns {Array} Patient medicine analysis
   */
  async getPatientMedicineAnalysis(patientId) {
    return await SymptomProgression.aggregate([
      {
        $match: {
          patient: patientId,
          isActive: true,
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: 'medicines',
          localField: 'medicine',
          foreignField: '_id',
          as: 'medicineDetails'
        }
      },
      { $unwind: '$medicineDetails' },
      {
        $group: {
          _id: '$medicine',
          medicineName: { $first: '$medicineDetails.name' },
          category: { $first: '$medicineDetails.category' },
          progressionCount: { $sum: 1 },
          symptoms: { $addToSet: '$symptom.name' },
          avgSeverity: { $avg: '$analytics.averageSeverity' },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          uniqueSymptoms: { $size: '$symptoms' },
          resolutionRate: {
            $multiply: [{ $divide: ['$resolvedCount', '$progressionCount'] }, 100]
          }
        }
      },
      { $sort: { progressionCount: -1 } }
    ]);
  }

  /**
   * Get patient progression timeline
   * @param {String} patientId - Patient ID
   * @returns {Array} Timeline data
   */
  async getPatientProgressionTimeline(patientId) {
    return await SymptomProgression.find({
      patient: patientId,
      isActive: true,
      isDeleted: false
    })
    .populate('medicine', 'name category')
    .select('symptom timeline status analytics medicine')
    .sort({ 'timeline.startDate': -1 })
    .limit(50);
  }
}

module.exports = new SymptomProgressionAnalytics();