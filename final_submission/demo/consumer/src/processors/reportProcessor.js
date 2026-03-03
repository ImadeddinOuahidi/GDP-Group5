/**
 * Report Processor
 * 
 * Orchestrates the processing of ADR reports using Gemini AI
 */

const mongoose = require('mongoose');
const GeminiService = require('../services/geminiService');
const MinioService = require('../services/minioService');

// Import the Report model schema (same as backend)
const reportSideEffectSchema = new mongoose.Schema({}, { strict: false });
const ReportSideEffect = mongoose.models.ReportSideEffect || 
  mongoose.model('ReportSideEffect', reportSideEffectSchema);

// Medication model
const medicationSchema = new mongoose.Schema({}, { strict: false });
const Medication = mongoose.models.Medication || 
  mongoose.model('Medication', medicationSchema);

class ReportProcessor {
  constructor() {
    this.geminiService = new GeminiService();
    this.minioService = new MinioService();
    
    // Processing pipeline steps - extensible for future enhancements
    this.pipeline = [
      this.fetchReportData.bind(this),
      this.fetchMediaFiles.bind(this),
      this.analyzeWithAI.bind(this),
      this.updateReport.bind(this)
    ];
  }

  /**
   * Process a report through the pipeline
   */
  async process(message) {
    const { reportId } = message;
    
    if (!reportId) {
      return { success: false, error: 'No report ID provided' };
    }

    // Create processing context
    const context = {
      reportId,
      startTime: Date.now(),
      steps: [],
      errors: []
    };

    try {
      // Run through pipeline
      for (const step of this.pipeline) {
        const stepName = step.name;
        console.log(`[Processor] Running step: ${stepName}`);
        
        const stepStart = Date.now();
        await step(context);
        
        context.steps.push({
          name: stepName,
          duration: Date.now() - stepStart,
          success: true
        });
      }

      return {
        success: true,
        reportId,
        analysis: context.analysis,
        processingTime: Date.now() - context.startTime,
        steps: context.steps
      };

    } catch (error) {
      console.error(`[Processor] Error processing report ${reportId}:`, error);
      
      context.errors.push({
        step: 'processing',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Try to save error state to report
      try {
        await this.saveProcessingError(reportId, context.errors);
      } catch (saveError) {
        console.error('[Processor] Failed to save error state:', saveError);
      }

      return {
        success: false,
        reportId,
        error: error.message,
        errors: context.errors,
        processingTime: Date.now() - context.startTime
      };
    }
  }

  /**
   * Step 1: Fetch report data from database
   */
  async fetchReportData(context) {
    const report = await ReportSideEffect.findById(context.reportId).lean();
    
    if (!report) {
      throw new Error(`Report not found: ${context.reportId}`);
    }

    // Check if already processed
    if (report.metadata?.aiProcessed && !context.forceReprocess) {
      console.log(`[Processor] Report ${context.reportId} already processed`);
      context.alreadyProcessed = true;
      context.analysis = report.metadata?.aiAnalysis;
      return;
    }

    // Fetch medication details
    let medication = null;
    if (report.medicine) {
      medication = await Medication.findById(report.medicine).lean();
    }

    context.report = report;
    context.medication = medication;
    context.reportData = {
      ...report,
      medication
    };

    console.log(`[Processor] Fetched report data for ${context.reportId}`);
  }

  /**
   * Step 2: Fetch media files from MinIO
   */
  async fetchMediaFiles(context) {
    if (context.alreadyProcessed) return;

    context.mediaFiles = [];
    
    // Check for attachments in report
    const attachments = context.report?.attachments || [];
    
    if (attachments.length === 0) {
      console.log('[Processor] No media files to fetch');
      return;
    }

    try {
      const files = await this.minioService.getFilesForProcessing(attachments);
      context.mediaFiles = files;
      console.log(`[Processor] Fetched ${files.length} media files`);
    } catch (error) {
      console.warn('[Processor] Error fetching media files:', error.message);
      // Continue without media files
    }
  }

  /**
   * Step 3: Analyze report with Gemini AI
   */
  async analyzeWithAI(context) {
    if (context.alreadyProcessed) return;

    // Prepare report data for AI
    const reportData = {
      medication: context.medication || {
        name: context.report?.medicineName || 'Unknown',
        genericName: context.report?.medicineGenericName,
        category: context.report?.medicineCategory
      },
      sideEffects: context.report?.sideEffects || [],
      patientInfo: context.report?.patientInfo || {},
      medicationUsage: context.report?.medicationUsage || {},
      reportDetails: context.report?.reportDetails || {}
    };

    // Call Gemini service
    const result = await this.geminiService.analyzeReport(reportData, context.mediaFiles);
    
    if (!result.success) {
      console.warn('[Processor] AI analysis returned unsuccessful result');
    }

    context.analysis = result.analysis;
    context.modelUsed = result.modelUsed;
    
    console.log(`[Processor] AI analysis completed using model: ${result.modelUsed}`);
  }

  /**
   * Step 4: Update report with analysis results
   */
  async updateReport(context) {
    if (context.alreadyProcessed) {
      console.log('[Processor] Skipping update - already processed');
      return;
    }

    const update = {
      // Update severity based on AI analysis
      'sideEffects.0.aiSeverity': context.analysis?.severity?.level,
      
      // Update priority
      priority: context.analysis?.priority || 'Medium',
      
      // Store AI analysis in metadata
      'metadata.aiProcessed': true,
      'metadata.aiProcessedAt': new Date(),
      'metadata.aiModelUsed': context.modelUsed,
      'metadata.aiAnalysis': context.analysis,
      'metadata.aiRiskScore': context.analysis?.overallRiskScore,
      
      // Update report status to reflect processing
      status: context.report?.status === 'Draft' ? 'Submitted' : context.report?.status
    };

    // Update seriousness if AI determined it
    if (context.analysis?.seriousness?.classification) {
      update['reportDetails.seriousness'] = context.analysis.seriousness.classification;
    }

    // Update body systems if identified
    if (context.analysis?.bodySystemsAffected?.length > 0 && context.report?.sideEffects?.[0]) {
      update['sideEffects.0.bodySystem'] = context.analysis.bodySystemsAffected[0];
    }

    await ReportSideEffect.findByIdAndUpdate(context.reportId, {
      $set: update
    });

    console.log(`[Processor] Updated report ${context.reportId} with AI analysis`);
  }

  /**
   * Save processing error to report
   */
  async saveProcessingError(reportId, errors) {
    await ReportSideEffect.findByIdAndUpdate(reportId, {
      $set: {
        'metadata.aiProcessingError': errors[errors.length - 1]?.error,
        'metadata.aiProcessingErrorAt': new Date()
      },
      $inc: {
        'metadata.aiProcessingAttempts': 1
      }
    });
  }
}

module.exports = ReportProcessor;
