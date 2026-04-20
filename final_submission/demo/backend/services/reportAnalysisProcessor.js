const ReportSideEffect = require('../models/ReportSideEffect');
const Medication = require('../models/Medication');
const minioService = require('./minioService');
const rabbitmqService = require('./rabbitmqService');
const aiProviderService = require('./aiProviderService');
const notificationService = require('./notificationService');

function isUrgentAnalysis(analysis = {}) {
  const urgencyLevel = analysis.patientGuidance?.urgencyLevel;
  if (urgencyLevel === 'urgent' || urgencyLevel === 'emergency') {
    return true;
  }

  return analysis.priority === 'High' || analysis.priority === 'Critical';
}

async function loadReportForAnalysis(reportId) {
  return ReportSideEffect.findById(reportId).populate([
    { path: 'medicine', select: 'name genericName category manufacturer' },
    { path: 'patient', select: 'firstName lastName email' },
    { path: 'reportedBy', select: 'firstName lastName role email' },
  ]);
}

async function buildAnalysisPayload(report) {
  let medication = report.medicine;

  if (!medication && report.medicine) {
    medication = await Medication.findById(report.medicine).select('name genericName category manufacturer');
  }

  return {
    _id: report._id,
    medicine: medication,
    patient: report.patient,
    reportedBy: report.reportedBy,
    patientInfo: report.patientInfo || {},
    sideEffects: report.sideEffects || [],
    medicationUsage: report.medicationUsage || {},
    reportDetails: report.reportDetails || {},
    attachments: report.attachments || [],
  };
}

async function loadMediaFiles(report) {
  if (!Array.isArray(report.attachments) || report.attachments.length === 0) {
    return [];
  }

  if (!minioService.isAvailable()) {
    return [];
  }

  try {
    return await minioService.getFilesForProcessing(report.attachments);
  } catch (error) {
    console.error('[ReportAnalysisProcessor] Failed to load media attachments:', error.message);
    return [];
  }
}

async function markQueued(reportId) {
  await ReportSideEffect.findByIdAndUpdate(reportId, {
    $set: {
      'metadata.aiStatus': 'queued',
      'metadata.aiLastQueuedAt': new Date(),
      'metadata.aiProcessingError': null,
    },
  });
}

async function processReportAnalysis(reportId, options = {}) {
  const { force = false, source = 'direct' } = options;
  const report = await loadReportForAnalysis(reportId);

  if (!report) {
    throw new Error('Report not found');
  }

  if (!force && report.metadata?.aiProcessed && report.metadata?.aiStatus === 'completed') {
    return {
      success: true,
      skipped: true,
      reason: 'already_processed',
      reportId: String(reportId),
    };
  }

  await ReportSideEffect.findByIdAndUpdate(reportId, {
    $set: {
      'metadata.aiStatus': 'processing',
      'metadata.aiLastStartedAt': new Date(),
      'metadata.aiProcessingError': null,
    },
    $inc: {
      'metadata.aiProcessingAttempts': 1,
    },
  });

  try {
    const payload = await buildAnalysisPayload(report);
    const mediaFiles = await loadMediaFiles(report);
    const analysisResult = await aiProviderService.analyzeSeverity(payload, mediaFiles);
    const analysis = analysisResult.analysis;

    const update = {
      priority: analysis.priority || report.priority || 'Medium',
      'reportDetails.seriousness':
        analysis.seriousness?.classification || report.reportDetails?.seriousness || 'Non-serious',
      'metadata.aiProcessed': true,
      'metadata.aiProcessedAt': new Date(),
      'metadata.aiStatus': 'completed',
      'metadata.aiLastCompletedAt': new Date(),
      'metadata.aiProvider': analysisResult.provider,
      'metadata.aiModelUsed': analysisResult.modelUsed,
      'metadata.aiRiskScore': analysis.overallRiskScore,
      'metadata.aiAnalysis': {
        ...analysis,
        model: analysisResult.modelUsed,
        processedAt: new Date(),
      },
      'metadata.aiProcessingError': null,
    };

    if (report.status === 'Draft') {
      update.status = 'Submitted';
    }

    if (Array.isArray(analysis.bodySystemsAffected) && analysis.bodySystemsAffected.length > 0 && Array.isArray(report.sideEffects) && report.sideEffects.length > 0) {
      update['sideEffects.0.bodySystem'] = analysis.bodySystemsAffected[0];
    }

    const updatedReport = await ReportSideEffect.findByIdAndUpdate(
      reportId,
      { $set: update },
      { new: true }
    ).populate([
      { path: 'medicine', select: 'name genericName category manufacturer' },
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'reportedBy', select: 'firstName lastName role email' },
    ]);

    await notificationService.notifyAIAnalysisComplete(updatedReport);

    if (isUrgentAnalysis(analysis)) {
      await notificationService.notifyStaffUrgentReport(updatedReport, {
        trigger: 'ai_analysis',
        urgencyLevel: analysis.patientGuidance?.urgencyLevel,
      });
    }

    return {
      success: true,
      reportId: String(reportId),
      source,
      provider: analysisResult.provider,
      modelUsed: analysisResult.modelUsed,
      analysis,
      report: updatedReport,
    };
  } catch (error) {
    await ReportSideEffect.findByIdAndUpdate(reportId, {
      $set: {
        'metadata.aiStatus': 'failed',
        'metadata.aiLastFailedAt': new Date(),
        'metadata.aiProcessingError': error.message,
      },
    });

    console.error('[ReportAnalysisProcessor] Report analysis failed:', error.message);
    throw error;
  }
}

async function queueReportAnalysis(reportId, options = {}) {
  const { force = false, reportSnapshot = null } = options;
  await markQueued(reportId);

  let snapshot = reportSnapshot;
  if (!snapshot) {
    snapshot = await ReportSideEffect.findById(reportId);
  }

  if (!snapshot) {
    throw new Error('Report not found');
  }

  const published = await rabbitmqService.publishReportCreated(snapshot);

  if (!published) {
    setImmediate(() => {
      processReportAnalysis(reportId, {
        force,
        source: 'in_process_fallback',
      }).catch((error) => {
        console.error('[ReportAnalysisProcessor] In-process fallback failed:', error.message);
      });
    });

    return {
      queued: true,
      delivery: 'in_process_fallback',
    };
  }

  return {
    queued: true,
    delivery: 'rabbitmq',
  };
}

module.exports = {
  processReportAnalysis,
  queueReportAnalysis,
};
