const OpenAI = require('openai');

const {
  buildFallbackSeverityAnalysis,
  buildHeuristicDuplicateAdjudication,
  normalizeSeverityAnalysis,
  clampConfidence,
} = require('./aiAnalysisFallback');

let GoogleGenerativeAI;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch {
  GoogleGenerativeAI = null;
}

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function extractJson(value = '') {
  if (!value) {
    throw new Error('Empty AI response');
  }

  const trimmed = String(value).trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No JSON object found in AI response');
    }
    return JSON.parse(match[0]);
  }
}

function simplifyReport(report = {}) {
  return {
    reportId: String(report._id || report.reportId || ''),
    medicine: {
      id: String(report.medicine?._id || report.medicine || ''),
      name: report.medicine?.name || report.medicineName || '',
      genericName: report.medicine?.genericName || report.medicineGenericName || '',
    },
    patient: {
      id: String(report.patient?._id || report.patient || ''),
      name:
        report.patient?.firstName || report.patient?.lastName
          ? `${report.patient?.firstName || ''} ${report.patient?.lastName || ''}`.trim()
          : '',
      age: report.patientInfo?.age,
      gender: report.patientInfo?.gender,
    },
    sideEffects: (report.sideEffects || []).map((effect = {}) => ({
      effect: effect.effect || '',
      severity: effect.severity || '',
      onset: effect.onset || '',
      description: effect.description || '',
      bodySystem: effect.bodySystem || '',
    })),
    medicationUsage: {
      dosage: report.medicationUsage?.dosage || {},
      indication: report.medicationUsage?.indication || '',
      startDate: report.medicationUsage?.startDate || null,
    },
    reportDetails: {
      incidentDate: report.reportDetails?.incidentDate || null,
      reportDate: report.reportDetails?.reportDate || report.createdAt || null,
      seriousness: report.reportDetails?.seriousness || '',
      outcome: report.reportDetails?.outcome || '',
    },
    heuristicScore: report.heuristicScore ?? report.similarityScore ?? report.score,
  };
}

function buildSeverityPrompt(reportData = {}, mediaFiles = []) {
  const simplified = simplifyReport(reportData);
  const attachmentSummary =
    mediaFiles.length > 0
      ? mediaFiles.map((file) => `${file.mimeType || 'application/octet-stream'} (${file.size || 0} bytes)`).join(', ')
      : 'No media attachments';

  return `You are ChatGPT acting as a pharmacovigilance assistant.
Analyze this adverse drug reaction report and return ONLY valid JSON.

Report:
${JSON.stringify({ ...simplified, attachmentSummary }, null, 2)}

Return this shape exactly:
{
  "severity": {
    "level": "Mild" | "Moderate" | "Severe" | "Life-threatening",
    "confidence": 0.0,
    "reasoning": "string"
  },
  "priority": "Low" | "Medium" | "High" | "Critical",
  "seriousness": {
    "classification": "Serious" | "Non-serious",
    "reasons": ["string"]
  },
  "bodySystemsAffected": ["string"],
  "riskFactors": ["string"],
  "recommendedActions": ["string"],
  "causalityAssessment": {
    "likelihood": "Certain" | "Probable" | "Possible" | "Unlikely" | "Unassessable",
    "reasoning": "string"
  },
  "keywords": ["string"],
  "summary": "string",
  "patientGuidance": {
    "urgencyLevel": "routine" | "soon" | "urgent" | "emergency",
    "recommendation": "string",
    "nextSteps": ["string"],
    "warningSignsToWatch": ["string"],
    "canContinueMedication": true,
    "shouldSeekMedicalAttention": false
  },
  "references": [
    {
      "title": "string",
      "uri": "string"
    }
  ]
}

Rules:
- Base severity on clinical significance, not only patient wording.
- Confidence must be a number between 0 and 1.
- If uncertain, keep references empty rather than inventing them.
- Keep the JSON compact and do not include markdown fences.`;
}

function buildDuplicatePrompt(sourceReport = {}, candidates = []) {
  const simplifiedSource = simplifyReport(sourceReport);
  const simplifiedCandidates = candidates.map((candidate) => simplifyReport(candidate));

  return `You are ChatGPT acting as a pharmacovigilance reviewer.
Decide whether each candidate report is a duplicate of the source report.
Return ONLY valid JSON.

Source report:
${JSON.stringify(simplifiedSource, null, 2)}

Candidate reports:
${JSON.stringify(simplifiedCandidates, null, 2)}

Return this shape exactly:
{
  "candidates": [
    {
      "candidateReportId": "string",
      "isDuplicate": true,
      "confidence": 0.0,
      "reasoning": "string",
      "recommendedAction": "review" | "flag" | "merge" | "ignore"
    }
  ]
}

Rules:
- Mark a candidate as duplicate only when the same medication, patient context, symptom narrative, and timing strongly indicate the same event.
- Confidence must be between 0 and 1.
- Use "merge" only for very strong duplicates with no meaningful conflicting details.
- Use "flag" when the event is likely duplicate but should still be confirmed by staff.
- Use "review" when overlap exists but manual comparison is still needed.
- Use "ignore" when the candidate is not a duplicate.
- Keep the JSON compact and do not include markdown fences.`;
}

function normalizeDuplicateResults(candidates = [], parsed = {}) {
  const parsedResults = Array.isArray(parsed.candidates) ? parsed.candidates : [];
  const parsedById = new Map(
    parsedResults
      .filter((entry) => entry && entry.candidateReportId)
      .map((entry) => [String(entry.candidateReportId), entry])
  );

  return candidates.map((candidate = {}) => {
    const candidateReportId = String(candidate.reportId || candidate._id || '');
    const parsedCandidate = parsedById.get(candidateReportId) || {};
    const heuristicScore = Number(candidate.heuristicScore ?? candidate.similarityScore ?? candidate.score ?? 0);
    const fallbackConfidence = clampConfidence(heuristicScore, 0.45);

    return {
      candidateReportId,
      isDuplicate:
        typeof parsedCandidate.isDuplicate === 'boolean'
          ? parsedCandidate.isDuplicate
          : heuristicScore >= 0.7,
      confidence: clampConfidence(parsedCandidate.confidence, fallbackConfidence),
      reasoning:
        parsedCandidate.reasoning ||
        'AI response did not include detailed duplicate reasoning for this candidate.',
      recommendedAction:
        parsedCandidate.recommendedAction ||
        (heuristicScore >= 0.9 ? 'merge' : heuristicScore >= 0.8 ? 'flag' : heuristicScore >= 0.7 ? 'review' : 'ignore'),
    };
  });
}

class AIProviderService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.openaiClient = this.openaiApiKey ? new OpenAI({ apiKey: this.openaiApiKey }) : null;
    this.geminiClient =
      GoogleGenerativeAI && this.geminiApiKey
        ? new GoogleGenerativeAI(this.geminiApiKey)
        : null;
  }

  get isOpenAIConfigured() {
    return Boolean(this.openaiClient);
  }

  get isGeminiConfigured() {
    return Boolean(this.geminiClient);
  }

  async analyzeSeverity(reportData = {}, mediaFiles = []) {
    const prompt = buildSeverityPrompt(reportData, mediaFiles);

    if (this.isOpenAIConfigured) {
      try {
        const response = await this.openaiClient.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are a precise medical data analysis assistant. Return JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const parsed = extractJson(response.choices?.[0]?.message?.content || '');
        return {
          success: true,
          provider: 'openai',
          modelUsed: OPENAI_MODEL,
          fallbackUsed: false,
          analysis: normalizeSeverityAnalysis(parsed, reportData),
        };
      } catch (error) {
        console.error('[AIProviderService] OpenAI severity analysis failed:', error.message);
      }
    }

    if (this.isGeminiConfigured) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
        const response = await model.generateContent(prompt);
        const parsed = extractJson(response.response.text());

        return {
          success: true,
          provider: 'gemini',
          modelUsed: GEMINI_MODEL,
          fallbackUsed: false,
          analysis: normalizeSeverityAnalysis(parsed, reportData),
        };
      } catch (error) {
        console.error('[AIProviderService] Gemini severity analysis failed:', error.message);
      }
    }

    return buildFallbackSeverityAnalysis(reportData, 'Structured AI providers unavailable, using heuristic severity analysis.');
  }

  async adjudicateDuplicates(sourceReport = {}, candidates = []) {
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return {
        success: true,
        provider: 'heuristic',
        modelUsed: 'no-candidates',
        fallbackUsed: true,
        results: [],
      };
    }

    const prompt = buildDuplicatePrompt(sourceReport, candidates);

    if (this.isOpenAIConfigured) {
      try {
        const response = await this.openaiClient.chat.completions.create({
          model: OPENAI_MODEL,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'You are a precise duplicate-adjudication assistant. Return JSON only.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const parsed = extractJson(response.choices?.[0]?.message?.content || '');

        return {
          success: true,
          provider: 'openai',
          modelUsed: OPENAI_MODEL,
          fallbackUsed: false,
          results: normalizeDuplicateResults(candidates, parsed),
        };
      } catch (error) {
        console.error('[AIProviderService] OpenAI duplicate adjudication failed:', error.message);
      }
    }

    if (this.isGeminiConfigured) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: GEMINI_MODEL });
        const response = await model.generateContent(prompt);
        const parsed = extractJson(response.response.text());

        return {
          success: true,
          provider: 'gemini',
          modelUsed: GEMINI_MODEL,
          fallbackUsed: false,
          results: normalizeDuplicateResults(candidates, parsed),
        };
      } catch (error) {
        console.error('[AIProviderService] Gemini duplicate adjudication failed:', error.message);
      }
    }

    return buildHeuristicDuplicateAdjudication(sourceReport, candidates);
  }
}

module.exports = new AIProviderService();
