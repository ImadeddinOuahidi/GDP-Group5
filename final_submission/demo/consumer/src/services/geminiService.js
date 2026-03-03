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
      // For text analysis (with Google Search grounding)
      text: 'gemini-3.1-pro-preview',
      // For multimodal (text + images/video)
      multimodal: 'gemini-3.1-pro-preview'
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
      const hasMedia = mediaFiles.length > 0;
      const modelName = hasMedia ? this.models.multimodal : this.models.text;
      
      // Configure model with Google Search grounding enabled
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        },
        // Enable Google Search for grounding — lets the model verify medication
        // info, known ADRs, and reference real pharmaceutical documentation
        tools: [{
          googleSearch: {}
        }]
      });

      // Build the prompt
      const prompt = this.buildAnalysisPrompt(reportData);
      
      // Prepare content parts
      const parts = [{ text: prompt }];
      
      // Add media files if present (images, videos, audio)
      for (const media of mediaFiles) {
        if (media.data && media.mimeType) {
          // Supported types: image/*, video/mp4, video/webm, audio/*
          parts.push({
            inlineData: {
              mimeType: media.mimeType,
              data: media.data  // base64
            }
          });
          console.log(`[GeminiService] Added media: ${media.mimeType} (${Math.round((media.data.length * 3 / 4) / 1024)}KB)`);
        }
      }

      console.log('[GeminiService] Sending analysis request with Google Search grounding...');
      const result = await model.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      // Extract grounding metadata (search references) if available
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const searchSuggestions = groundingMetadata?.searchEntryPoint?.renderedContent;
      const groundingChunks = groundingMetadata?.groundingChunks || [];
      const webSources = groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({
          title: chunk.web.title || '',
          uri: chunk.web.uri || ''
        }));

      // Parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(text);
      } catch (parseError) {
        // Try to extract JSON from mixed response (grounding can add text around JSON)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse AI response as JSON');
        }
      }
      
      // Attach source references from Google Search grounding
      if (webSources.length > 0) {
        analysis.references = webSources;
      }
      
      console.log(`[GeminiService] Analysis completed. ${webSources.length} references found.`);
      return {
        success: true,
        analysis: this.validateAndEnhanceAnalysis(analysis, reportData),
        modelUsed: modelName,
        groundingUsed: webSources.length > 0,
        references: webSources,
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

    return `You are a clinical pharmacovigilance AI assistant specializing in adverse drug reaction (ADR) analysis.

You have access to Google Search. USE IT to:
1. Verify this medication is a real pharmaceutical product — find its official prescribing information, drug label, or monograph
2. Cross-reference the reported side effects against known ADRs in medical literature, FDA/EMA databases, and drug documentation (e.g. DailyMed, Drugs.com, RxList)
3. Check for relevant safety alerts, black box warnings, or recent recalls for this medication
4. Find authoritative references (FDA, EMA, WHO-UMC, PubMed, pharmaceutical manufacturer documents) to support your severity and causality assessment

Analyze the following report and provide a structured, evidence-based assessment.

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

SEVERITY CLASSIFICATION (use exactly these values):
- "Mild" — Minor side effect, generally tolerable, does not interfere with daily activities
- "Moderate" — Noticeable side effect, may interfere with daily activities, may require treatment
- "Severe" — Significant side effect, interferes with daily activities, requires medical intervention
- "Life-threatening" — Immediately dangerous, requires emergency intervention, could result in death

PRIORITY LEVELS: "Low" | "Medium" | "High" | "Critical"

If images or videos are attached, analyze them for visible symptoms (rashes, swelling, discoloration, inflammation, skin reactions, etc.) and incorporate visual findings into your severity and causality assessment.

Provide your analysis in the following JSON structure:

{
  "severity": {
    "level": "Mild|Moderate|Severe|Life-threatening",
    "confidence": 0.0-1.0,
    "reasoning": "Evidence-based explanation referencing drug documentation"
  },
  "priority": "Low|Medium|High|Critical",
  "seriousness": {
    "classification": "Serious|Non-serious",
    "reasons": ["List of reasons if serious, referencing regulatory criteria"]
  },
  "bodySystemsAffected": ["List of body systems affected using MedDRA SOC terms"],
  "riskFactors": ["Identified risk factors from patient history and medication profile"],
  "recommendedActions": ["Specific actions for medical professionals based on evidence"],
  "causalityAssessment": {
    "likelihood": "Certain|Probable|Possible|Unlikely|Unassessable",
    "reasoning": "WHO-UMC causality assessment reasoning referencing drug documentation"
  },
  "keywords": ["Relevant medical keywords for indexing"],
  "summary": "Brief 2-3 sentence clinical summary including whether this is a known ADR per the drug's documentation",
  "medicalTerminology": [
    { "term": "MedDRA preferred term", "code": "PT code if known", "system": "MedDRA" }
  ],
  "medicationVerification": {
    "isVerifiedMedication": true|false,
    "drugClass": "Pharmacological class of the medication",
    "knownADR": true|false,
    "knownADRFrequency": "Very common|Common|Uncommon|Rare|Very rare|Not documented",
    "labelWarnings": ["Relevant warnings from the drug label/prescribing information"],
    "sources": ["URLs or names of reference documents consulted"]
  },
  "patientGuidance": {
    "urgencyLevel": "routine|soon|urgent|emergency",
    "recommendation": "Clear, empathetic patient-friendly message. Reference whether this is a known/expected side effect per the drug's documentation. Use simple language.",
    "nextSteps": ["Step-by-step actions for the patient in plain language"],
    "warningSignsToWatch": ["Specific symptoms that should prompt immediate medical attention"],
    "canContinueMedication": true|false,
    "shouldSeekMedicalAttention": true|false
  }
}

PATIENT GUIDANCE URGENCY RULES:
- "routine": Known common side effect per drug documentation, monitoring only needed
- "soon": Uncommon or concerning side effect, should see doctor within a few days
- "urgent": Serious reaction, should see doctor within 24-48 hours
- "emergency": Life-threatening reaction, seek immediate emergency care (ER/call 911)

For Life-threatening or Severe reactions: urgencyLevel should be "emergency" or "urgent"
For known/expected common side effects: urgencyLevel can be "routine" with reassuring guidance

CRITICAL RULES:
- Respond ONLY with valid JSON, no additional text
- Base severity on clinical significance and drug documentation, not just patient perception
- The medicalVerification section MUST include whether this is a known ADR for this specific medication
- Include source URLs in medicationVerification.sources when possible
- If images/videos show visible symptoms, describe them in your reasoning
- patientGuidance.recommendation should be empathetic and reference the drug's known side effect profile`;
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
      medicationVerification: analysis.medicationVerification || {
        isVerifiedMedication: false,
        drugClass: 'Unknown',
        knownADR: false,
        knownADRFrequency: 'Not documented',
        labelWarnings: [],
        sources: []
      },
      references: analysis.references || [],
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
