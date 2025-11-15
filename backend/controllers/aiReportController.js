const aiService = require('../services/aiService');
const Medicine = require('../models/Medicine');
const ReportSideEffect = require('../models/ReportSideEffect');
const symptomProgressionService = require('../services/symptomProgressionService');

/**
 * AI-powered side effect report submission
 * Processes text, images, and audio to automatically fill report fields
 */
const submitAIReport = async (req, res) => {
  try {
    // Extract inputs from request
    const inputs = {
      text: req.body.text || '',
      images: req.files?.images || [],
      audio: req.files?.audio?.[0] || null
    };

    // Log the processing attempt
    console.log('Processing AI report submission:', {
      hasText: !!inputs.text,
      imageCount: inputs.images.length,
      hasAudio: !!inputs.audio,
      userId: req.user.id
    });

    // Process multimodal input with AI
    const extractedData = await aiService.processMultimodalInput(inputs);
    
    // Try to find matching medicine in database
    let medicine = null;
    if (extractedData.medicine?.name) {
      medicine = await findMedicineByName(extractedData.medicine.name);
    }

    // Suggest medicines if none found but we have description
    let suggestedMedicines = [];
    if (!medicine && (extractedData.medicine?.name || extractedData.medicationUsage?.indication)) {
      const searchQuery = extractedData.medicine?.name || extractedData.medicationUsage?.indication;
      suggestedMedicines = await searchMedicines(searchQuery);
    }

    // Prepare response data
    const responseData = {
      extractedData,
      suggestedMedicines,
      foundMedicine: medicine,
      processingMetadata: {
        confidence: extractedData.confidence || 'Medium',
        inputTypes: {
          text: !!inputs.text,
          images: inputs.images.length,
          audio: !!inputs.audio
        },
        timestamp: new Date().toISOString()
      }
    };

    // If user wants to auto-submit and we have enough confidence
    if (req.body.autoSubmit === 'true' && extractedData.confidence === 'High' && medicine) {
      try {
        const savedReport = await createReportFromExtractedData(extractedData, medicine._id, req.user.id);
        responseData.autoSubmittedReport = savedReport;
        responseData.message = 'Report automatically processed and submitted successfully';
      } catch (autoSubmitError) {
        console.error('Auto-submit failed:', autoSubmitError);
        responseData.autoSubmitError = 'Auto-submit failed, please review and submit manually';
      }
    }

    res.status(200).json({
      status: 'success',
      message: 'Multimodal input processed successfully',
      data: responseData
    });

  } catch (error) {
    console.error('AI Report Processing Error:', error);
    
    // Determine error type and response
    if (error.message.includes('API key')) {
      return res.status(503).json({
        status: 'error',
        message: 'AI service temporarily unavailable. Please try submitting a manual report.',
        code: 'AI_SERVICE_UNAVAILABLE'
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return res.status(429).json({
        status: 'error',
        message: 'AI service rate limit reached. Please try again later.',
        code: 'AI_RATE_LIMIT'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to process multimodal input',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Preview extracted report data without submitting
 */
const previewAIReport = async (req, res) => {
  try {
    const inputs = {
      text: req.body.text || '',
      images: req.files?.images || [],
      audio: req.files?.audio?.[0] || null
    };

    // Process with AI but don't save to database
    const extractedData = await aiService.processMultimodalInput(inputs);
    
    // Find potential medicine matches
    let suggestedMedicines = [];
    if (extractedData.medicine?.name) {
      suggestedMedicines = await searchMedicines(extractedData.medicine.name);
    }

    res.status(200).json({
      status: 'success',
      message: 'Report data extracted successfully (preview mode)',
      data: {
        extractedData,
        suggestedMedicines,
        isPreview: true
      }
    });

  } catch (error) {
    console.error('AI Preview Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to preview report data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Submit report using AI-extracted data with user confirmation
 */
const submitConfirmedAIReport = async (req, res) => {
  try {
    const { extractedData, medicineId, modifications } = req.body;
    
    // Validate required data
    if (!extractedData || !medicineId) {
      return res.status(400).json({
        status: 'error',
        message: 'Extracted data and medicine ID are required'
      });
    }

    // Verify medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        status: 'error',
        message: 'Medicine not found'
      });
    }

    // Apply user modifications if provided
    let finalData = extractedData;
    if (modifications) {
      finalData = { ...extractedData, ...modifications };
    }

    // Create and save the report
    const savedReport = await createReportFromExtractedData(finalData, medicineId, req.user.id);

    res.status(201).json({
      status: 'success',
      message: 'AI-assisted report submitted successfully',
      data: savedReport
    });

  } catch (error) {
    console.error('Confirmed AI Report Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit confirmed report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Helper Functions

/**
 * Find medicine by name (fuzzy matching)
 */
async function findMedicineByName(medicineName) {
  try {
    // Try exact match first
    let medicine = await Medicine.findOne({
      $or: [
        { name: new RegExp(medicineName, 'i') },
        { genericName: new RegExp(medicineName, 'i') }
      ]
    });

    return medicine;
  } catch (error) {
    console.error('Medicine search error:', error);
    return null;
  }
}

/**
 * Search for medicines based on query
 */
async function searchMedicines(query, limit = 5) {
  try {
    const medicines = await Medicine.find({
      $or: [
        { name: new RegExp(query, 'i') },
        { genericName: new RegExp(query, 'i') },
        { 'indications.condition': new RegExp(query, 'i') }
      ]
    })
    .select('name genericName dosageForm strength category')
    .limit(limit);

    return medicines;
  } catch (error) {
    console.error('Medicine search error:', error);
    return [];
  }
}

/**
 * Create report from AI-extracted data
 */
async function createReportFromExtractedData(extractedData, medicineId, userId) {
  const reportData = {
    medicine: medicineId,
    reportedBy: userId,
    sideEffects: extractedData.sideEffects || [],
    medicationUsage: {
      indication: extractedData.medicationUsage?.indication || 'Not specified',
      dosage: {
        amount: extractedData.medicationUsage?.dosage?.amount || 'Not specified',
        frequency: extractedData.medicationUsage?.dosage?.frequency || 'Not specified',
        route: extractedData.medicationUsage?.dosage?.route || 'Oral'
      },
      startDate: extractedData.medicationUsage?.startDate || new Date(),
      endDate: extractedData.medicationUsage?.endDate
    },
    reportDetails: {
      incidentDate: extractedData.reportDetails?.incidentDate || new Date(),
      reportDate: new Date(),
      seriousness: extractedData.reportDetails?.seriousness || 'Non-serious',
      outcome: extractedData.reportDetails?.outcome || 'Unknown'
    },
    patientInfo: {
      age: extractedData.patientInfo?.age,
      gender: extractedData.patientInfo?.gender,
      weight: extractedData.patientInfo?.weight ? {
        value: extractedData.patientInfo.weight,
        unit: 'kg'
      } : undefined,
      height: extractedData.patientInfo?.height ? {
        value: extractedData.patientInfo.height,
        unit: 'cm'
      } : undefined
    },
    additionalInfo: {
      aiGenerated: true,
      aiConfidence: extractedData.confidence || 'Medium',
      originalInput: extractedData.additionalNotes || '',
      processingTimestamp: new Date()
    }
  };

  // Remove undefined values
  Object.keys(reportData.patientInfo).forEach(key => {
    if (reportData.patientInfo[key] === undefined) {
      delete reportData.patientInfo[key];
    }
  });

  const report = new ReportSideEffect(reportData);
  const savedReport = await report.save();

  // Auto-create symptom progression tracking for significant side effects
  try {
    await autoCreateProgressionTracking(savedReport, userId, extractedData);
  } catch (progressionError) {
    console.error('Auto-create progression tracking error:', progressionError);
    // Don't fail the report creation if progression tracking fails
  }

  return savedReport;
}

/**
 * Auto-create symptom progression tracking for significant side effects
 */
async function autoCreateProgressionTracking(report, userId, extractedData) {
  try {
    // Only create progression tracking for moderate to severe side effects
    const significantSideEffects = report.sideEffects.filter(se => 
      ['Moderate', 'Severe', 'Life-threatening'].includes(se.severity)
    );

    for (const sideEffect of significantSideEffects) {
      try {
        // Prepare progression data
        const reportData = { reportId: report._id };
        const symptomData = {
          sideEffectId: sideEffect._id,
          initialImpact: {
            daily_activities: extractedData.functionalImpact?.daily_activities || 0,
            work_performance: extractedData.functionalImpact?.work_performance || 0,
            sleep_quality: extractedData.functionalImpact?.sleep_quality || 0,
            social_activities: extractedData.functionalImpact?.social_activities || 0,
            mood: extractedData.functionalImpact?.mood || 0
          },
          notes: `Auto-created from AI report: ${sideEffect.effect}. ${sideEffect.description || ''}`
        };

        // Determine patient ID
        const patientId = report.patient || report.reportedBy;

        // Create progression tracking
        await symptomProgressionService.createProgressionFromReport(
          reportData,
          symptomData,
          patientId
        );

        console.log(`Created progression tracking for side effect: ${sideEffect.effect}`);
      } catch (singleProgressionError) {
        console.error(`Failed to create progression for side effect ${sideEffect.effect}:`, singleProgressionError);
        // Continue with other side effects
      }
    }
  } catch (error) {
    console.error('Auto-create progression tracking error:', error);
    throw error;
  }
}

/**
 * Check if symptom progression should be auto-suggested
 */
function shouldSuggestProgression(sideEffect, extractedData) {
  const suggestCriteria = [
    // Severity-based
    ['Moderate', 'Severe', 'Life-threatening'].includes(sideEffect.severity),
    
    // Duration-based (if mentioned in extracted data)
    extractedData.expectedDuration && extractedData.expectedDuration > 7,
    
    // Body system-based (chronic conditions)
    ['Nervous System', 'Psychiatric', 'Musculoskeletal', 'Dermatological'].includes(sideEffect.bodySystem),
    
    // Pattern-based (recurring or ongoing)
    sideEffect.frequency && ['Continuous', 'Intermittent'].includes(sideEffect.frequency)
  ];

  return suggestCriteria.some(criterion => criterion === true);
}

module.exports = {
  submitAIReport,
  previewAIReport,
  submitConfirmedAIReport,
  autoCreateProgressionTracking,
  shouldSuggestProgression
};