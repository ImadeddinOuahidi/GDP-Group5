/**
 * AI Service (Backend)
 *
 * Handles pre-submission AI extraction for the /aisubmit and /aipreview routes.
 * Extracts structured report fields from free-form text (and optionally images)
 * entered by the user BEFORE the report is saved.
 *
 * Heavy AI analysis (severity, causality, Google Search grounding) happens in the
 * consumer service asynchronously AFTER the report is saved and published to RabbitMQ.
 *
 * Uses Gemini if GEMINI_API_KEY is available, otherwise falls back to basic
 * text parsing so the backend always starts without crashing.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

let GoogleGenerativeAI;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch {
  // Package not installed in backend – will use fallback parser
  GoogleGenerativeAI = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

const aiService = {
  /**
   * Process multimodal input (text, images, audio) and return structured report data.
   * @param {{ text: string, images: Array, audio: object|null }} inputs
   * @returns {Promise<object>} extractedData matching the ReportSideEffect schema shape
   */
  async processMultimodalInput(inputs) {
    const { text = '', images = [] } = inputs;

    if (!text && images.length === 0) {
      return buildDefaultExtraction('No input provided');
    }

    // Use Gemini when available
    if (GoogleGenerativeAI && GEMINI_API_KEY) {
      try {
        return await extractWithGemini(text, images);
      } catch (err) {
        console.warn('[aiService] Gemini extraction failed, falling back to text parser:', err.message);
      }
    }

    // Fallback: simple text heuristics
    return extractWithHeuristics(text);
  }
};

module.exports = aiService;

// ─────────────────────────────────────────────────────────────────────────────
// Gemini extraction
// ─────────────────────────────────────────────────────────────────────────────

async function extractWithGemini(text, images) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `You are a medical data extraction assistant. Extract structured adverse drug reaction report data from the user's input and return ONLY valid JSON.

User input:
"${text}"

Return exactly this JSON structure (use null for unknown fields):
{
  "medicine": { "name": string|null, "genericName": string|null },
  "sideEffects": [
    {
      "effect": string,
      "severity": "Mild"|"Moderate"|"Severe"|"Life-threatening",
      "onset": "Immediate"|"Within hours"|"Within days"|"Within weeks"|"Unknown",
      "description": string|null
    }
  ],
  "medicationUsage": {
    "indication": string|null,
    "dosage": {
      "amount": string|null,
      "frequency": string|null,
      "route": "Oral"|"Intravenous"|"Intramuscular"|"Subcutaneous"|"Topical"|"Inhalation"|"Other"|null
    },
    "startDate": string|null
  },
  "reportDetails": {
    "seriousness": "Serious"|"Non-serious",
    "outcome": "Recovered/Resolved"|"Recovering"|"Not recovered"|"Unknown"
  },
  "patientInfo": {
    "age": number|null,
    "gender": "male"|"female"|"other"|null
  },
  "confidence": "High"|"Medium"|"Low",
  "additionalNotes": string|null
}

Rules:
- severity defaults to "Moderate" if unclear
- seriousness is "Serious" if severity is Severe or Life-threatening
- confidence is "High" if medicine name AND at least one side effect are clearly identifiable
- Return ONLY the JSON object, no markdown fences`;

  const parts = [{ text: prompt }];

  // Attach images if provided
  for (const img of images.slice(0, 3)) {
    if (img.buffer && img.mimetype) {
      parts.push({
        inlineData: {
          mimeType: img.mimetype,
          data: img.buffer.toString('base64')
        }
      });
    }
  }

  const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
  const raw = result.response.text().trim();

  // Strip optional markdown fences
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(jsonStr);

  // Ensure sideEffects is always an array
  if (!Array.isArray(parsed.sideEffects) || parsed.sideEffects.length === 0) {
    parsed.sideEffects = [{ effect: 'Not specified', severity: 'Mild', onset: 'Unknown' }];
  }

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Heuristic fallback parser
// ─────────────────────────────────────────────────────────────────────────────

function extractWithHeuristics(text) {
  const lower = text.toLowerCase();

  // Detect severity keywords
  let severity = 'Moderate';
  if (/life.?threatening|emergency|death|fatal|critical/i.test(text)) severity = 'Life-threatening';
  else if (/severe|serious|hospital|ER|emergency room/i.test(text)) severity = 'Severe';
  else if (/mild|slight|minor|small/i.test(text)) severity = 'Mild';

  // Detect onset
  let onset = 'Unknown';
  if (/immediately|right away|instant/i.test(text)) onset = 'Immediate';
  else if (/hours?|hour later/i.test(text)) onset = 'Within hours';
  else if (/days?|day later|next day/i.test(text)) onset = 'Within days';
  else if (/weeks?|week later/i.test(text)) onset = 'Within weeks';

  // Try to find medicine name (simple heuristic: word before "mg" or capitalised drug-like word)
  let medicineName = null;
  const mgMatch = text.match(/(\w+)\s+\d+\s*mg/i);
  if (mgMatch) medicineName = mgMatch[1];

  // Detect route
  let route = 'Oral';
  if (/inject|IV|intravenous/i.test(text)) route = 'Intravenous';
  else if (/topical|cream|gel|ointment/i.test(text)) route = 'Topical';
  else if (/inhale|inhaler|nebulizer/i.test(text)) route = 'Inhalation';

  const confidence = medicineName && text.length > 20 ? 'Medium' : 'Low';

  return {
    medicine: { name: medicineName, genericName: null },
    sideEffects: [{
      effect: text.length > 100 ? text.slice(0, 100) : text,
      severity,
      onset,
      description: text.length > 100 ? text : null
    }],
    medicationUsage: {
      indication: null,
      dosage: { amount: null, frequency: null, route },
      startDate: null
    },
    reportDetails: {
      seriousness: severity === 'Severe' || severity === 'Life-threatening' ? 'Serious' : 'Non-serious',
      outcome: 'Unknown'
    },
    patientInfo: { age: null, gender: null },
    confidence,
    additionalNotes: text
  };
}

function buildDefaultExtraction(note) {
  return {
    medicine: { name: null, genericName: null },
    sideEffects: [{ effect: 'Not specified', severity: 'Mild', onset: 'Unknown' }],
    medicationUsage: {
      indication: null,
      dosage: { amount: null, frequency: null, route: 'Oral' },
      startDate: null
    },
    reportDetails: { seriousness: 'Non-serious', outcome: 'Unknown' },
    patientInfo: { age: null, gender: null },
    confidence: 'Low',
    additionalNotes: note
  };
}
