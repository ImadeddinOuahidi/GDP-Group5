/**
 * Gemini AI Service
 * 
 * Handles all interactions with Google's Gemini AI models
 * for analyzing ADR reports, images, and generating metadata.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Response schema for structured JSON output
const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    severity: {
      type: 'object',
      properties: {
        level: { 
          type: 'string', 
          enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening'] 
        },
        confidence: { type: 'number' },
        reasoning: { type: 'string' }
      },
      required: ['level', 'confidence', 'reasoning']
    },
    priority: {
      type: 'string',
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    seriousness: {
      type: 'object',
      properties: {
        classification: { type: 'string', enum: ['Serious', 'Non-serious'] },
        reasons: { 
          type: 'array', 
          items: { type: 'string' } 
        }
      },
      required: ['classification']
    },
    bodySystemsAffected: {
      type: 'array',
      items: { type: 'string' }
    },
    riskFactors: {
      type: 'array',
      items: { type: 'string' }
    },
    recommendedActions: {
      type: 'array',
      items: { type: 'string' }
    },
    causalityAssessment: {
      type: 'object',
      properties: {
        likelihood: { 
          type: 'string', 
          enum: ['Certain', 'Probable', 'Possible', 'Unlikely', 'Unassessable'] 
        },
        reasoning: { type: 'string' }
      }
    },
    keywords: {
      type: 'array',
      items: { type: 'string' }
    },
    summary: { type: 'string' },
    medicalTerminology: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          term: { type: 'string' },
          code: { type: 'string' },
          system: { type: 'string' }
        }
      }
    }
  },
  required: ['severity', 'priority', 'seriousness', 'recommendedActions', 'summary']
};

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey || this.apiKey === 'your-gemini-api-key') {
      console.warn('[GeminiService] No valid API key configured. Using fallback analysis.');
      this.isConfigured = false;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.isConfigured = true;
    }
    
    // Model configurations for different use cases
    this.models = {
      // For text analysis
      text: 'gemini-2.5-flash',
      // For multimodal (text + images/video)
      multimodal: 'gemini-2.5-flash'
    };
  }

  /**
   * Analyze a side effect report with Gemini AI
   */
  async analyzeReport(reportData, mediaFiles = []) {
    if (!this.isConfigured) {
      console.log('[GeminiService] Using fallback analysis (no API key)');
      return this.fallbackAnalysis(reportData);
    }

    try {
      const modelName = mediaFiles.length > 0 ? this.models.multimodal : this.models.text;
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      });

      // Build the prompt
      const prompt = this.buildAnalysisPrompt(reportData);
      
      // Prepare content parts
      const parts = [{ text: prompt }];
      
      // Add media files if present
      for (const media of mediaFiles) {
        if (media.data && media.mimeType) {
          parts.push({
            inlineData: {
              mimeType: media.mimeType,
              data: media.data
            }
          });
        }
      }

      console.log('[GeminiService] Sending analysis request...');
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const analysis = JSON.parse(text);
      
      console.log('[GeminiService] Analysis completed successfully');
      return {
        success: true,
        analysis: this.validateAndEnhanceAnalysis(analysis, reportData),
        modelUsed: modelName,
        processedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('[GeminiService] Analysis error:', error);
      
      // Return fallback analysis on error
      return {
        success: true,
        analysis: this.fallbackAnalysis(reportData).analysis,
        modelUsed: 'fallback',
        error: error.message,
        processedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Build the analysis prompt for Gemini
   */
  buildAnalysisPrompt(reportData) {
    const { medication, sideEffects, patientInfo, medicationUsage, reportDetails } = reportData;

    return `You are a medical AI assistant specialized in adverse drug reaction (ADR) analysis. 
Analyze the following side effect report and provide a structured assessment with patient-friendly guidance.

## REPORT INFORMATION

### Medication
- Name: ${medication?.name || 'Unknown'}
- Generic Name: ${medication?.genericName || 'N/A'}
- Category: ${medication?.category || 'Unknown'}
- Dosage: ${medicationUsage?.dosage?.amount || 'Unknown'}
- Frequency: ${medicationUsage?.dosage?.frequency || 'Unknown'}
- Route: ${medicationUsage?.dosage?.route || 'Unknown'}
- Indication: ${medicationUsage?.indication || 'Unknown'}
- Start Date: ${medicationUsage?.startDate || 'Unknown'}

### Side Effects Reported
${sideEffects?.map((se, idx) => `
${idx + 1}. Effect: ${se.effect}
   - Severity (patient-reported): ${se.severity}
   - Onset: ${se.onset}
   - Body System: ${se.bodySystem || 'Not specified'}
   - Description: ${se.description || 'No additional description'}
`).join('\n') || 'No side effects described'}

### Patient Information
- Age: ${patientInfo?.age || 'Unknown'}
- Gender: ${patientInfo?.gender || 'Unknown'}
- Weight: ${patientInfo?.weight?.value || 'Unknown'} ${patientInfo?.weight?.unit || ''}
- Medical History: ${patientInfo?.medicalHistory?.join(', ') || 'Not provided'}
- Known Allergies: ${patientInfo?.allergies?.join(', ') || 'Not provided'}

### Report Details
- Incident Date: ${reportDetails?.incidentDate || 'Unknown'}
- Patient-Reported Seriousness: ${reportDetails?.seriousness || 'Unknown'}
- Outcome: ${reportDetails?.outcome || 'Unknown'}

## ANALYSIS INSTRUCTIONS

Based on the above information, provide a comprehensive analysis in the following JSON structure:

{
  "severity": {
    "level": "Mild|Moderate|Severe|Life-threatening",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of severity assessment"
  },
  "priority": "Low|Medium|High|Critical",
  "seriousness": {
    "classification": "Serious|Non-serious",
    "reasons": ["List of reasons if serious"]
  },
  "bodySystemsAffected": ["List of body systems affected"],
  "riskFactors": ["Identified risk factors"],
  "recommendedActions": ["List of recommended actions for medical professionals"],
  "causalityAssessment": {
    "likelihood": "Certain|Probable|Possible|Unlikely|Unassessable",
    "reasoning": "Explanation of causality assessment"
  },
  "keywords": ["Relevant medical keywords for indexing"],
  "summary": "Brief 2-3 sentence clinical summary of the case",
  "medicalTerminology": [
    {
      "term": "MedDRA or medical term",
      "code": "If known",
      "system": "MedDRA|SNOMED|ICD-10"
    }
  ],
  "patientGuidance": {
    "urgencyLevel": "routine|soon|urgent|emergency",
    "recommendation": "A clear, patient-friendly message explaining what this side effect means and what they should do. Use simple language. Examples: 'This appears to be a common and expected side effect. Continue your medication as prescribed and monitor symptoms.' OR 'This is a concerning reaction. Please stop taking the medication and contact your doctor within 24 hours.' OR 'This is a medical emergency. Stop the medication immediately and seek emergency care.'",
    "nextSteps": ["Step-by-step actions for the patient in plain language"],
    "warningSignsToWatch": ["Specific symptoms that should prompt immediate medical attention"],
    "canContinueMedication": true|false,
    "shouldSeekMedicalAttention": true|false
  }
}

PATIENT GUIDANCE RULES:
- urgencyLevel "routine": Common side effect, no action needed except monitoring
- urgencyLevel "soon": Should see a doctor within a few days
- urgencyLevel "urgent": Should see a doctor within 24-48 hours
- urgencyLevel "emergency": Seek immediate medical care (ER/call emergency services)

For Life-threatening or Severe reactions: urgencyLevel should be "emergency" or "urgent"
For known/expected side effects: urgencyLevel can be "routine" with reassuring guidance

IMPORTANT: 
- Respond ONLY with valid JSON, no additional text.
- Base severity on clinical significance, not just patient perception.
- The patientGuidance.recommendation should be empathetic and in plain language.
- Be specific in warningSignsToWatch - these help patients know when to escalate.
- If images are provided, incorporate visual findings into the analysis.`;
  }

  /**
   * Validate and enhance the AI analysis
   */
  validateAndEnhanceAnalysis(analysis, reportData) {
    // Ensure required fields exist with defaults
    const validated = {
      severity: analysis.severity || {
        level: reportData.sideEffects?.[0]?.severity || 'Moderate',
        confidence: 0.5,
        reasoning: 'Unable to fully assess severity'
      },
      priority: analysis.priority || 'Medium',
      seriousness: analysis.seriousness || {
        classification: 'Non-serious',
        reasons: []
      },
      bodySystemsAffected: analysis.bodySystemsAffected || [],
      riskFactors: analysis.riskFactors || [],
      recommendedActions: analysis.recommendedActions || [
        'Review patient history',
        'Consider alternative medications if symptoms persist',
        'Monitor for symptom progression'
      ],
      causalityAssessment: analysis.causalityAssessment || {
        likelihood: 'Possible',
        reasoning: 'Temporal relationship exists but insufficient data for definitive assessment'
      },
      keywords: analysis.keywords || [],
      summary: analysis.summary || 'Side effect report requires clinical review.',
      medicalTerminology: analysis.medicalTerminology || [],
      patientGuidance: analysis.patientGuidance || this.generateDefaultPatientGuidance(analysis, reportData),
      aiProcessed: true,
      aiProcessedAt: new Date().toISOString()
    };

    // Add computed fields
    validated.overallRiskScore = this.calculateRiskScore(validated);
    
    return validated;
  }

  /**
   * Generate default patient guidance based on severity
   */
  generateDefaultPatientGuidance(analysis, reportData) {
    const severity = analysis?.severity?.level || reportData.sideEffects?.[0]?.severity || 'Moderate';
    
    if (severity === 'Life-threatening') {
      return {
        urgencyLevel: 'emergency',
        recommendation: 'This is a serious reaction that requires immediate medical attention. Please stop taking the medication and seek emergency care right away.',
        nextSteps: [
          'Stop taking the medication immediately',
          'Call emergency services or go to the nearest emergency room',
          'Bring your medication information with you'
        ],
        warningSignsToWatch: [
          'Difficulty breathing',
          'Swelling of face, lips, or throat',
          'Severe chest pain',
          'Loss of consciousness'
        ],
        canContinueMedication: false,
        shouldSeekMedicalAttention: true
      };
    } else if (severity === 'Severe') {
      return {
        urgencyLevel: 'urgent',
        recommendation: 'This is a significant reaction that needs medical evaluation soon. Please contact your doctor within 24 hours or visit an urgent care facility.',
        nextSteps: [
          'Consider stopping the medication until you speak with your doctor',
          'Contact your doctor or healthcare provider today',
          'Document your symptoms and when they started'
        ],
        warningSignsToWatch: [
          'Symptoms getting worse',
          'New symptoms appearing',
          'Fever or chills',
          'Severe pain or discomfort'
        ],
        canContinueMedication: false,
        shouldSeekMedicalAttention: true
      };
    } else if (severity === 'Moderate') {
      return {
        urgencyLevel: 'soon',
        recommendation: 'This side effect should be discussed with your doctor. While not an emergency, please schedule an appointment within the next few days.',
        nextSteps: [
          'Continue your medication unless symptoms worsen significantly',
          'Schedule an appointment with your doctor within a few days',
          'Keep track of your symptoms'
        ],
        warningSignsToWatch: [
          'Symptoms becoming more severe',
          'Symptoms lasting longer than expected',
          'New symptoms developing'
        ],
        canContinueMedication: true,
        shouldSeekMedicalAttention: false
      };
    } else {
      return {
        urgencyLevel: 'routine',
        recommendation: 'This appears to be a minor side effect that is commonly associated with this medication. Continue taking your medication as prescribed and monitor your symptoms.',
        nextSteps: [
          'Continue your medication as prescribed',
          'Monitor your symptoms',
          'Mention this at your next regular appointment'
        ],
        warningSignsToWatch: [
          'Symptoms becoming more severe',
          'Symptoms not improving over time'
        ],
        canContinueMedication: true,
        shouldSeekMedicalAttention: false
      };
    }
  }

  /**
   * Calculate overall risk score (0-100)
   */
  calculateRiskScore(analysis) {
    let score = 0;
    
    // Severity contribution (0-40)
    const severityScores = {
      'Life-threatening': 40,
      'Severe': 30,
      'Moderate': 15,
      'Mild': 5
    };
    score += severityScores[analysis.severity.level] || 15;
    
    // Priority contribution (0-30)
    const priorityScores = {
      'Critical': 30,
      'High': 20,
      'Medium': 10,
      'Low': 5
    };
    score += priorityScores[analysis.priority] || 10;
    
    // Seriousness contribution (0-20)
    if (analysis.seriousness.classification === 'Serious') {
      score += 20;
    }
    
    // Risk factors contribution (0-10)
    score += Math.min(analysis.riskFactors.length * 2, 10);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Fallback analysis when Gemini is unavailable
   */
  fallbackAnalysis(reportData) {
    const sideEffect = reportData.sideEffects?.[0] || {};
    
    // Rule-based severity assessment
    const patientSeverity = sideEffect.severity || 'Moderate';
    let priority = 'Medium';
    let seriousness = 'Non-serious';
    
    if (patientSeverity === 'Life-threatening') {
      priority = 'Critical';
      seriousness = 'Serious';
    } else if (patientSeverity === 'Severe') {
      priority = 'High';
      seriousness = 'Serious';
    }
    
    // Generate patient guidance based on severity
    const patientGuidance = this.generateDefaultPatientGuidance({ severity: { level: patientSeverity } }, reportData);
    
    return {
      success: true,
      analysis: {
        severity: {
          level: patientSeverity,
          confidence: 0.6,
          reasoning: 'Based on patient-reported severity (AI analysis unavailable)'
        },
        priority,
        seriousness: {
          classification: seriousness,
          reasons: seriousness === 'Serious' ? ['Patient-reported severe symptoms'] : []
        },
        bodySystemsAffected: sideEffect.bodySystem ? [sideEffect.bodySystem] : [],
        riskFactors: [],
        recommendedActions: [
          'Clinical review recommended',
          'Consider contacting patient for follow-up',
          'Review medication history'
        ],
        causalityAssessment: {
          likelihood: 'Possible',
          reasoning: 'Temporal relationship exists - manual review recommended'
        },
        keywords: [
          reportData.medication?.name,
          sideEffect.effect
        ].filter(Boolean),
        summary: `Patient reported ${patientSeverity.toLowerCase()} side effect: ${sideEffect.effect || 'unspecified'}. Manual clinical review recommended.`,
        medicalTerminology: [],
        patientGuidance,
        aiProcessed: false,
        fallbackUsed: true,
        processedAt: new Date().toISOString(),
        overallRiskScore: this.calculateRiskScore({
          severity: { level: patientSeverity },
          priority,
          seriousness: { classification: seriousness },
          riskFactors: []
        })
      },
      modelUsed: 'rule-based-fallback'
    };
  }

  /**
   * Analyze an image for visible symptoms
   */
  async analyzeImage(imageData, mimeType = 'image/jpeg') {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Gemini AI not configured'
      };
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.models.multimodal,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json'
        }
      });

      const prompt = `Analyze this medical image for visible symptoms or adverse reactions.
Look for: rashes, swelling, discoloration, inflammation, skin changes, or any abnormalities.
Provide a structured analysis in JSON format:
{
  "visibleSymptoms": ["List of observed symptoms"],
  "affectedAreas": ["Body areas affected"],
  "severity": "None|Mild|Moderate|Severe",
  "description": "Detailed clinical description",
  "recommendations": ["Suggested actions based on visual findings"]
}
If no concerning symptoms are visible, indicate that clearly.`;

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: imageData
          }
        }
      ]);

      const response = await result.response;
      const analysis = JSON.parse(response.text());

      return {
        success: true,
        analysis
      };

    } catch (error) {
      console.error('[GeminiService] Image analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = GeminiService;
