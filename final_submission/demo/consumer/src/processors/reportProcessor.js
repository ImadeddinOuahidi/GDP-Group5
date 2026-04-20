/**
 * Report Processor
 *
 * Orchestrates ADR report processing using consumer-local services.
 */

const mongoose = require('mongoose');
const GeminiService = require('../services/geminiService');
const MinioService = require('../services/minioService');

// Use non-strict schema in consumer so it can read/write evolving report shape.
const reportSideEffectSchema = new mongoose.Schema({}, { strict: false });
const medicationSchema = new mongoose.Schema({}, { strict: false });

const ReportSideEffect = mongoose.models.ReportSideEffect
  || mongoose.model('ReportSideEffect', reportSideEffectSchema);
const Medication = mongoose.models.Medication
  || mongoose.model('Medication', medicationSchema);

class ReportProcessor {
  constructor() {
    this.geminiService = new GeminiService();
    this.minioService = new MinioService();
  }

  async process(message = {}) {
    const { reportId, forceReprocess } = message;

    if (!reportId) {
      return { success: false, error: 'No report ID provided' };
    }

    const report = await ReportSideEffect.findById(reportId);
    if (!report) {
      return { success: false, error: `Report not found: ${reportId}` };
    }

    if (!forceReprocess && report?.metadata?.aiProcessed && report?.metadata?.aiStatus === 'completed') {
      return {
        success: true,
        reportId,
        skipped: true,
        reason: 'already_processed',
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
      let medication = report.medicine;
      if (medication && typeof medication !== 'object') {
        medication = await Medication.findById(medication).lean();
      }

      const reportPayload = {
        _id: report._id,
        medicine: medication || report.medicine,
        patient: report.patient,
        reportedBy: report.reportedBy,
        patientInfo: report.patientInfo || {},
        sideEffects: report.sideEffects || [],
        medicationUsage: report.medicationUsage || {},
        reportDetails: report.reportDetails || {},
      };

      const attachments = Array.isArray(report.attachments) ? report.attachments : [];
      const mediaFiles = attachments.length > 0
        ? await this.minioService.getFilesForProcessing(attachments)
        : [];

      const analysisResult = await this.geminiService.analyzeReport(reportPayload, mediaFiles);
      const analysis = analysisResult.analysis || {};

      const update = {
        'metadata.aiProcessed': true,
        'metadata.aiProcessedAt': new Date(),
        'metadata.aiStatus': 'completed',
        'metadata.aiLastCompletedAt': new Date(),
        'metadata.aiModelUsed': analysisResult.modelUsed,
        'metadata.aiAnalysis': {
          ...analysis,
          processedAt: new Date(),
        },
        'metadata.aiRiskScore': analysis?.overallRiskScore,
        'metadata.aiProcessingError': null,
      };

      if (analysis?.priority) {
        update.priority = analysis.priority;
      }

      if (analysis?.seriousness?.classification) {
        update['reportDetails.seriousness'] = analysis.seriousness.classification;
      }

      if (Array.isArray(analysis?.bodySystemsAffected)
        && analysis.bodySystemsAffected.length > 0
        && Array.isArray(report.sideEffects)
        && report.sideEffects.length > 0) {
        update['sideEffects.0.bodySystem'] = analysis.bodySystemsAffected[0];
      }

      if (report.status === 'Draft') {
        update.status = 'Submitted';
      }

      await ReportSideEffect.findByIdAndUpdate(reportId, { $set: update });

      return {
        success: true,
        reportId,
        source: 'rabbitmq',
        modelUsed: analysisResult.modelUsed,
        analysis,
      };
    } catch (error) {
      await ReportSideEffect.findByIdAndUpdate(reportId, {
        $set: {
          'metadata.aiStatus': 'failed',
          'metadata.aiLastFailedAt': new Date(),
          'metadata.aiProcessingError': error.message,
        },
      });

      return {
        success: false,
        reportId,
        error: error.message,
      };
    }
  }
}

module.exports = ReportProcessor;
