const SeverityAnalysisJob = require('../jobs/severityAnalysisJob');
const ReportSideEffect = require('../models/ReportSideEffect');

/**
 * Trigger severity analysis for a specific report
 * @route POST /api/reports/:id/analyze-severity
 * @access Private (Doctor/Admin)
 */
exports.analyzeSeverity = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = false } = req.body; // Force re-analysis even if already processed

    // Check if report exists
    const report = await ReportSideEffect.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Check if already processed (unless force is true)
    if (report.metadata?.aiProcessed && !force) {
      return res.status(200).json({
        success: true,
        message: 'Report already analyzed',
        data: {
          analysis: report.metadata.aiAnalysis,
          processedAt: report.metadata.aiProcessedAt
        }
      });
    }

    // Trigger analysis
    const result = await SeverityAnalysisJob.processReport(id);

    if (result.success) {
      // Fetch updated report
      const updatedReport = await ReportSideEffect.findById(id);
      
      return res.status(200).json({
        success: true,
        message: 'Severity analysis completed successfully',
        data: {
          analysis: updatedReport.metadata.aiAnalysis,
          priority: updatedReport.priority,
          seriousness: updatedReport.reportDetails.seriousness
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Severity analysis failed',
        error: result.error
      });
    }

  } catch (error) {
    console.error('Analyze severity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get severity analysis status for a report
 * @route GET /api/reports/:id/severity-status
 * @access Private
 */
exports.getSeverityStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await ReportSideEffect.findById(id).select('metadata priority reportDetails.seriousness');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const status = {
      processed: report.metadata?.aiProcessed || false,
      processedAt: report.metadata?.aiProcessedAt || null,
      attempts: report.metadata?.aiProcessingAttempts || 0,
      error: report.metadata?.aiProcessingError || null,
      currentPriority: report.priority,
      currentSeriousness: report.reportDetails?.seriousness
    };

    if (report.metadata?.aiAnalysis) {
      status.analysis = {
        overallSeverity: report.metadata.aiAnalysis.overallSeverity,
        priorityLevel: report.metadata.aiAnalysis.priorityLevel,
        seriousnessClassification: report.metadata.aiAnalysis.seriousnessClassification,
        confidenceScore: report.metadata.aiAnalysis.confidenceScore,
        requiresImmediateAttention: report.metadata.aiAnalysis.requiresImmediateAttention,
        model: report.metadata.aiAnalysis.model,
        analyzedAt: report.metadata.aiAnalysis.analyzedAt
      };
    }

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get severity status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Batch process severity analysis for multiple reports
 * @route POST /api/reports/batch-analyze
 * @access Private (Admin only)
 */
exports.batchAnalyzeSeverity = async (req, res) => {
  try {
    const { reportIds, reprocessFailed = false } = req.body;

    let ids = reportIds;

    // If reprocessFailed is true, find failed/unprocessed reports
    if (reprocessFailed) {
      const reports = await ReportSideEffect.find({
        $or: [
          { 'metadata.aiProcessed': { $ne: true } },
          { 'metadata.aiProcessingError': { $exists: true } }
        ],
        isActive: true,
        isDeleted: false
      }).select('_id').limit(50);
      
      ids = reports.map(r => r._id.toString());
    }

    if (!ids || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No reports to process'
      });
    }

    // Start batch processing (async)
    setImmediate(async () => {
      try {
        await SeverityAnalysisJob.processBatch(ids);
      } catch (batchError) {
        console.error('[Batch Analysis] Error:', batchError);
      }
    });

    res.status(202).json({
      success: true,
      message: 'Batch analysis started',
      data: {
        reportCount: ids.length,
        status: 'processing'
      }
    });

  } catch (error) {
    console.error('Batch analyze severity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get AI analysis statistics
 * @route GET /api/reports/analysis-stats
 * @access Private (Doctor/Admin)
 */
exports.getAnalysisStats = async (req, res) => {
  try {
    const stats = await ReportSideEffect.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          processedReports: {
            $sum: { $cond: ['$metadata.aiProcessed', 1, 0] }
          },
          failedReports: {
            $sum: { $cond: [{ $ifNull: ['$metadata.aiProcessingError', false] }, 1, 0] }
          },
          averageConfidence: {
            $avg: '$metadata.aiAnalysis.confidenceScore'
          },
          immediateAttentionCount: {
            $sum: { $cond: ['$metadata.aiAnalysis.requiresImmediateAttention', 1, 0] }
          }
        }
      }
    ]);

    const severityDistribution = await ReportSideEffect.aggregate([
      {
        $match: {
          'metadata.aiProcessed': true,
          isActive: true,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$metadata.aiAnalysis.overallSeverity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || {
          totalReports: 0,
          processedReports: 0,
          failedReports: 0,
          averageConfidence: 0,
          immediateAttentionCount: 0
        },
        severityDistribution: severityDistribution.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Get analysis stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports;
