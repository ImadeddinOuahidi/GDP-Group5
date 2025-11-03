const OpenAI = require('openai');
const ReportSideEffect = require('../models/ReportSideEffect');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

/**
 * AI-powered severity analysis job
 * Analyzes report data using multimodal AI to determine severity levels
 */
class SeverityAnalysisJob {
  /**
   * Process a report for severity analysis
   * @param {String} reportId - Report ID to process
   */
  static async processReport(reportId) {
    try {
      console.log(`[Severity Job] Processing report: ${reportId}`);
      
      // Fetch the report
      const report = await ReportSideEffect.findById(reportId)
        .populate('medicine', 'name genericName category')
        .populate('patient', 'age gender');

      if (!report) {
        console.error(`[Severity Job] Report not found: ${reportId}`);
        return { success: false, message: 'Report not found' };
      }

      // Skip if already processed
      if (report.metadata?.aiProcessed) {
        console.log(`[Severity Job] Report already processed: ${reportId}`);
        return { success: true, message: 'Already processed', cached: true };
      }

      // Analyze severity using AI
      const analysis = await this.analyzeSeverity(report);

      // Update report with AI analysis
      await this.updateReportWithAnalysis(reportId, analysis);

      console.log(`[Severity Job] Successfully processed report: ${reportId}`);
      
      return {
        success: true,
        message: 'Severity analysis completed',
        analysis
      };

    } catch (error) {
      console.error(`[Severity Job] Error processing report ${reportId}:`, error);
      
      // Log error to report metadata
      await ReportSideEffect.findByIdAndUpdate(reportId, {
        'metadata.aiProcessingError': error.message,
        'metadata.aiProcessingAttempts': { $inc: 1 }
      });

      return {
        success: false,
        message: 'Severity analysis failed',
        error: error.message
      };
    }
  }

  /**
   * Analyze severity using AI multimodal models
   * @param {Object} report - Report document
   * @returns {Object} Analysis results
   */
  static async analyzeSeverity(report) {
    try {
      // Prepare context for AI analysis
      const context = this.prepareAnalysisContext(report);

      // Call OpenAI GPT-4 for analysis
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a medical AI assistant specialized in adverse drug reaction (ADR) analysis. 
Your task is to analyze side effect reports and determine:
1. Overall severity level (Mild, Moderate, Severe, Life-threatening)
2. Priority level (Low, Medium, High, Critical)
3. Seriousness classification (Serious, Non-serious)
4. Confidence score (0-100%)
5. Recommended actions
6. Risk factors

Use medical knowledge and pattern recognition to assess the severity based on:
- Reported side effects and their individual severities
- Patient demographics (age, gender)
- Medication information
- Onset time and duration
- Body systems affected
- Outcome information

Respond in JSON format only.`
          },
          {
            role: "user",
            content: context
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500
      });

      const aiResponse = JSON.parse(completion.choices[0].message.content);

      // Validate and structure the response
      return this.structureAnalysis(aiResponse, report);

    } catch (error) {
      console.error('[Severity Job] AI analysis error:', error);
      
      // Fallback to rule-based analysis
      return this.fallbackAnalysis(report);
    }
  }

  /**
   * Prepare context string for AI analysis
   * @param {Object} report - Report document
   * @returns {String} Context for AI
   */
  static prepareAnalysisContext(report) {
    const sideEffectsText = report.sideEffects.map((se, idx) => 
      `${idx + 1}. ${se.effect} (Severity: ${se.severity}, Onset: ${se.onset}, Body System: ${se.bodySystem || 'Unknown'})`
    ).join('\n');

    const patientInfo = report.patientInfo ? `
Patient Age: ${report.patientInfo.age || 'Unknown'}
Patient Gender: ${report.patientInfo.gender || 'Unknown'}
Patient Weight: ${report.patientInfo.weight?.value || 'Unknown'} ${report.patientInfo.weight?.unit || ''}
Patient Height: ${report.patientInfo.height?.value || 'Unknown'} ${report.patientInfo.height?.unit || ''}` : 'Patient information not provided';

    const medicationInfo = report.medicine ? `
Medication: ${report.medicine.name} (${report.medicine.genericName || 'N/A'})
Category: ${report.medicine.category || 'Unknown'}
Dosage: ${report.medicationUsage?.dosage?.amount || 'Unknown'}
Frequency: ${report.medicationUsage?.dosage?.frequency || 'Unknown'}
Route: ${report.medicationUsage?.dosage?.route || 'Unknown'}
Indication: ${report.medicationUsage?.indication || 'Unknown'}` : 'Medication information not available';

    return `Analyze the following adverse drug reaction report:

${medicationInfo}

Side Effects Reported:
${sideEffectsText}

${patientInfo}

Incident Date: ${report.reportDetails?.incidentDate || 'Unknown'}
Current Status: ${report.reportDetails?.outcome || 'Unknown'}
Reported Seriousness: ${report.reportDetails?.seriousness || 'Unknown'}

Please analyze this report and provide:
1. overallSeverity: Overall severity level (Mild, Moderate, Severe, Life-threatening)
2. priorityLevel: Urgency level (Low, Medium, High, Critical)
3. seriousnessClassification: Medical seriousness (Serious, Non-serious)
4. confidenceScore: Your confidence in this assessment (0-100)
5. reasoning: Brief explanation of your assessment
6. recommendedActions: Array of recommended actions
7. riskFactors: Array of identified risk factors
8. requiresImmediateAttention: Boolean indicating if immediate medical attention is needed`;
  }

  /**
   * Structure and validate AI analysis response
   * @param {Object} aiResponse - Raw AI response
   * @param {Object} report - Original report
   * @returns {Object} Structured analysis
   */
  static structureAnalysis(aiResponse, report) {
    // Map AI severity to our severity levels
    const severityMapping = {
      'mild': 'Mild',
      'moderate': 'Moderate',
      'severe': 'Severe',
      'life-threatening': 'Life-threatening',
      'life threatening': 'Life-threatening'
    };

    const priorityMapping = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };

    return {
      overallSeverity: severityMapping[aiResponse.overallSeverity?.toLowerCase()] || 'Moderate',
      priorityLevel: priorityMapping[aiResponse.priorityLevel?.toLowerCase()] || 'Medium',
      seriousnessClassification: aiResponse.seriousnessClassification || 'Non-serious',
      confidenceScore: Math.min(Math.max(aiResponse.confidenceScore || 70, 0), 100),
      reasoning: aiResponse.reasoning || 'AI analysis completed',
      recommendedActions: Array.isArray(aiResponse.recommendedActions) 
        ? aiResponse.recommendedActions.slice(0, 5) 
        : [],
      riskFactors: Array.isArray(aiResponse.riskFactors) 
        ? aiResponse.riskFactors.slice(0, 5) 
        : [],
      requiresImmediateAttention: aiResponse.requiresImmediateAttention || false,
      analyzedAt: new Date(),
      model: 'gpt-4-turbo-preview'
    };
  }

  /**
   * Fallback rule-based analysis when AI is unavailable
   * @param {Object} report - Report document
   * @returns {Object} Basic analysis
   */
  static fallbackAnalysis(report) {
    console.log('[Severity Job] Using fallback rule-based analysis');

    // Count severe side effects
    const severeSideEffects = report.sideEffects.filter(
      se => ['Severe', 'Life-threatening'].includes(se.severity)
    ).length;

    const moderateSideEffects = report.sideEffects.filter(
      se => se.severity === 'Moderate'
    ).length;

    // Determine overall severity based on most severe effect
    let overallSeverity = 'Mild';
    let priorityLevel = 'Low';
    
    if (report.sideEffects.some(se => se.severity === 'Life-threatening')) {
      overallSeverity = 'Life-threatening';
      priorityLevel = 'Critical';
    } else if (severeSideEffects > 0) {
      overallSeverity = 'Severe';
      priorityLevel = 'High';
    } else if (moderateSideEffects > 0) {
      overallSeverity = 'Moderate';
      priorityLevel = 'Medium';
    }

    // Check if serious based on outcome
    const seriousOutcomes = ['Fatal', 'Recovered with sequelae', 'Not recovered'];
    const isSevereSerious = report.reportDetails?.seriousness === 'Serious' || 
                           seriousOutcomes.includes(report.reportDetails?.outcome);

    return {
      overallSeverity,
      priorityLevel,
      seriousnessClassification: isSevereSerious ? 'Serious' : 'Non-serious',
      confidenceScore: 60,
      reasoning: 'Rule-based analysis (AI unavailable)',
      recommendedActions: [
        priorityLevel === 'Critical' ? 'Immediate medical evaluation required' : 'Monitor patient condition',
        'Review medication dosage',
        'Consider alternative medications'
      ],
      riskFactors: [
        overallSeverity === 'Severe' || overallSeverity === 'Life-threatening' ? 'High severity side effects' : 'Moderate side effects',
        'Multiple side effects reported'
      ],
      requiresImmediateAttention: priorityLevel === 'Critical',
      analyzedAt: new Date(),
      model: 'rule-based-fallback'
    };
  }

  /**
   * Update report with analysis results
   * @param {String} reportId - Report ID
   * @param {Object} analysis - Analysis results
   */
  static async updateReportWithAnalysis(reportId, analysis) {
    try {
      const updateData = {
        // Update priority if different
        priority: analysis.priorityLevel,
        
        // Update seriousness if provided
        'reportDetails.seriousness': analysis.seriousnessClassification,
        
        // Store AI analysis in metadata
        'metadata.aiAnalysis': {
          overallSeverity: analysis.overallSeverity,
          priorityLevel: analysis.priorityLevel,
          seriousnessClassification: analysis.seriousnessClassification,
          confidenceScore: analysis.confidenceScore,
          reasoning: analysis.reasoning,
          recommendedActions: analysis.recommendedActions,
          riskFactors: analysis.riskFactors,
          requiresImmediateAttention: analysis.requiresImmediateAttention,
          analyzedAt: analysis.analyzedAt,
          model: analysis.model
        },
        
        // Mark as processed
        'metadata.aiProcessed': true,
        'metadata.aiProcessedAt': new Date(),
        
        // Update each side effect with more accurate severity if needed
        sideEffects: await this.enhanceSideEffectSeverities(reportId, analysis)
      };

      await ReportSideEffect.findByIdAndUpdate(reportId, updateData, { 
        new: true,
        runValidators: false // Skip validation for metadata fields
      });

      console.log(`[Severity Job] Report ${reportId} updated with AI analysis`);
      
    } catch (error) {
      console.error('[Severity Job] Error updating report:', error);
      throw error;
    }
  }

  /**
   * Enhance individual side effect severities based on AI analysis
   * @param {String} reportId - Report ID
   * @param {Object} analysis - Analysis results
   * @returns {Array} Enhanced side effects
   */
  static async enhanceSideEffectSeverities(reportId, analysis) {
    const report = await ReportSideEffect.findById(reportId);
    
    // If AI provided high confidence and more severe rating, update individual side effects
    if (analysis.confidenceScore > 80 && 
        ['Severe', 'Life-threatening'].includes(analysis.overallSeverity)) {
      
      return report.sideEffects.map(se => ({
        ...se.toObject(),
        aiEnhancedSeverity: analysis.overallSeverity,
        aiConfidence: analysis.confidenceScore
      }));
    }
    
    // Otherwise, keep original side effects
    return report.sideEffects;
  }

  /**
   * Process multiple reports in batch
   * @param {Array} reportIds - Array of report IDs
   * @returns {Object} Batch processing results
   */
  static async processBatch(reportIds) {
    console.log(`[Severity Job] Starting batch processing of ${reportIds.length} reports`);
    
    const results = {
      total: reportIds.length,
      success: 0,
      failed: 0,
      cached: 0,
      errors: []
    };

    for (const reportId of reportIds) {
      try {
        const result = await this.processReport(reportId);
        
        if (result.success) {
          if (result.cached) {
            results.cached++;
          } else {
            results.success++;
          }
        } else {
          results.failed++;
          results.errors.push({ reportId, error: result.message });
        }
        
        // Rate limiting - wait between requests
        await this.delay(1000);
        
      } catch (error) {
        results.failed++;
        results.errors.push({ reportId, error: error.message });
      }
    }

    console.log(`[Severity Job] Batch processing completed:`, results);
    return results;
  }

  /**
   * Utility delay function
   * @param {Number} ms - Milliseconds to delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Reprocess reports that failed or need re-analysis
   * @param {Object} criteria - Search criteria for reports to reprocess
   */
  static async reprocessFailedReports(criteria = {}) {
    const filter = {
      $or: [
        { 'metadata.aiProcessed': { $ne: true } },
        { 'metadata.aiProcessingError': { $exists: true } }
      ],
      isActive: true,
      isDeleted: false,
      ...criteria
    };

    const reports = await ReportSideEffect.find(filter).select('_id').limit(50);
    const reportIds = reports.map(r => r._id.toString());

    if (reportIds.length === 0) {
      console.log('[Severity Job] No reports found for reprocessing');
      return { message: 'No reports to reprocess' };
    }

    return await this.processBatch(reportIds);
  }
}

module.exports = SeverityAnalysisJob;
