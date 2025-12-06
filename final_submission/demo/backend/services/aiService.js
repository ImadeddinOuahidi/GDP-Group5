const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const fuzzySearchService = require('./fuzzySearchService');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key'
    });
  }

  /**
   * Process multimodal input (text, images, audio) to extract side effect report data
   * @param {Object} inputs - Object containing text, images, and audio files
   * @returns {Object} Structured report data
   */
  async processMultimodalInput(inputs) {
    try {
      let combinedContext = '';
      
      // Process text input
      if (inputs.text) {
        combinedContext += `User Description: ${inputs.text}\n\n`;
      }

      // Process images if provided
      if (inputs.images && inputs.images.length > 0) {
        const imageAnalysis = await this.analyzeImages(inputs.images);
        combinedContext += `Image Analysis: ${imageAnalysis}\n\n`;
      }

      // Process audio if provided
      if (inputs.audio) {
        const audioTranscript = await this.transcribeAudio(inputs.audio);
        combinedContext += `Audio Transcript: ${audioTranscript}\n\n`;
      }

      // Use AI to structure the data
      const structuredData = await this.extractReportData(combinedContext);
      
      // Enhance medicine data with fuzzy matching
      if (structuredData.medicine && structuredData.medicine.name) {
        const medicineMatch = await this.findBestMedicineMatch(structuredData.medicine);
        if (medicineMatch && medicineMatch.confidence >= 0.4) {
          structuredData.medicine = {
            ...structuredData.medicine,
            matchedMedicine: medicineMatch.medicine,
            matchConfidence: medicineMatch.confidence,
            matchType: medicineMatch.matchType,
            matchSource: medicineMatch.source,
            // Keep original extracted data for reference
            originalExtracted: { ...structuredData.medicine }
          };
        } else {
          // If no good match found, get suggestions
          const suggestions = await this.suggestMedicines(structuredData.medicine.name);
          if (suggestions.length > 0) {
            structuredData.medicine.suggestions = suggestions.slice(0, 5);
          }
        }
      }
      
      return structuredData;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to process multimodal input: ' + error.message);
    }
  }

  /**
   * Analyze images to extract relevant medical information
   * @param {Array} images - Array of image file buffers or paths
   * @returns {string} Analysis of images
   */
  async analyzeImages(images) {
    try {
      let imageAnalysis = '';
      
      for (const image of images) {
        // Convert image to base64 for OpenAI Vision API
        const imageBuffer = image.buffer || await fs.readFile(image.path);
        const base64Image = imageBuffer.toString('base64');
        
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o-mini", // or "gpt-4-vision-preview"
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this medical image for potential side effects, symptoms, or adverse reactions. Look for visible symptoms like rashes, swelling, discoloration, or any abnormalities. Provide a detailed medical description."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        });

        imageAnalysis += response.choices[0].message.content + ' ';
      }
      
      return imageAnalysis.trim();
    } catch (error) {
      console.error('Image analysis error:', error);
      return 'Unable to analyze images at this time.';
    }
  }

  /**
   * Transcribe audio to text using OpenAI Whisper
   * @param {Object} audioFile - Audio file object
   * @returns {string} Transcribed text
   */
  async transcribeAudio(audioFile) {
    try {
      const audioBuffer = audioFile.buffer || await fs.readFile(audioFile.path);
      
      // Save temporary audio file for Whisper API
      const tempAudioPath = path.join(__dirname, '../temp', `audio_${Date.now()}.wav`);
      await fs.mkdir(path.dirname(tempAudioPath), { recursive: true });
      await fs.writeFile(tempAudioPath, audioBuffer);

      const transcription = await this.openai.audio.transcriptions.create({
        file: require('fs').createReadStream(tempAudioPath),
        model: "whisper-1",
        language: "en"
      });

      // Clean up temporary file
      await fs.unlink(tempAudioPath).catch(console.error);
      
      return transcription.text;
    } catch (error) {
      console.error('Audio transcription error:', error);
      return 'Unable to transcribe audio at this time.';
    }
  }

  /**
   * Extract structured report data from combined context using AI
   * @param {string} context - Combined context from all inputs
   * @returns {Object} Structured report data
   */
  async extractReportData(context) {
    try {
      const systemPrompt = `
You are a medical AI assistant specialized in pharmacovigilance and adverse drug reaction reporting. 
Your task is to extract structured information from user descriptions to create a standardized side effect report.

From the provided context, extract and structure the following information in JSON format:

{
  "medicine": {
    "name": "medicine name if mentioned",
    "genericName": "generic name if known",
    "dosage": "dosage information"
  },
  "sideEffects": [
    {
      "effect": "specific side effect description",
      "severity": "Mild|Moderate|Severe|Life-threatening",
      "onset": "Immediate|Within hours|Within days|Within weeks|Unknown",
      "bodySystem": "Gastrointestinal|Cardiovascular|Respiratory|Nervous System|Musculoskeletal|Dermatological|Genitourinary|Endocrine|Hematological|Psychiatric|Ocular|Otic|Other"
    }
  ],
  "medicationUsage": {
    "indication": "reason for taking medication",
    "dosage": {
      "amount": "dose amount",
      "frequency": "how often taken",
      "route": "Oral|Intravenous|Intramuscular|Subcutaneous|Topical|Inhalation|Rectal|Vaginal|Nasal|Ophthalmic|Otic"
    },
    "duration": "how long taken"
  },
  "reportDetails": {
    "seriousness": "Serious|Non-serious",
    "outcome": "Recovered/Resolved|Recovering|Not recovered|Recovered with sequelae|Fatal|Unknown"
  },
  "patientInfo": {
    "age": "age if mentioned",
    "gender": "male|female|other if mentioned",
    "weight": "weight if mentioned",
    "height": "height if mentioned"
  },
  "additionalNotes": "any other relevant information",
  "confidence": "High|Medium|Low - your confidence in the extraction"
}

Guidelines:
1. Only include information that is explicitly mentioned or can be reasonably inferred
2. Use "Unknown" or null for missing information
3. Map symptoms to appropriate body systems
4. Assess severity based on impact described
5. Determine seriousness based on medical criteria (hospitalization, life-threatening, etc.)
6. Provide your confidence level in the extraction
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1500
      });

      const extractedData = JSON.parse(response.choices[0].message.content);
      
      // Validate and clean the extracted data
      return this.validateAndCleanData(extractedData);
    } catch (error) {
      console.error('Data extraction error:', error);
      throw new Error('Failed to extract structured data from context');
    }
  }

  /**
   * Validate and clean extracted data
   * @param {Object} data - Extracted data from AI
   * @returns {Object} Validated and cleaned data
   */
  validateAndCleanData(data) {
    // Ensure required arrays exist
    if (!data.sideEffects || !Array.isArray(data.sideEffects)) {
      data.sideEffects = [];
    }

    // Validate side effects
    data.sideEffects = data.sideEffects.map(effect => ({
      effect: effect.effect || 'Unspecified side effect',
      severity: this.validateEnum(effect.severity, ['Mild', 'Moderate', 'Severe', 'Life-threatening'], 'Mild'),
      onset: this.validateEnum(effect.onset, ['Immediate', 'Within hours', 'Within days', 'Within weeks', 'Unknown'], 'Unknown'),
      bodySystem: this.validateEnum(effect.bodySystem, [
        'Gastrointestinal', 'Cardiovascular', 'Respiratory', 'Nervous System',
        'Musculoskeletal', 'Dermatological', 'Genitourinary', 'Endocrine',
        'Hematological', 'Psychiatric', 'Ocular', 'Otic', 'Other'
      ], 'Other')
    }));

    // Validate report details
    if (!data.reportDetails) data.reportDetails = {};
    data.reportDetails.seriousness = this.validateEnum(
      data.reportDetails.seriousness, 
      ['Serious', 'Non-serious'], 
      'Non-serious'
    );
    data.reportDetails.outcome = this.validateEnum(
      data.reportDetails.outcome,
      ['Recovered/Resolved', 'Recovering', 'Not recovered', 'Recovered with sequelae', 'Fatal', 'Unknown'],
      'Unknown'
    );

    // Ensure medication usage structure
    if (!data.medicationUsage) data.medicationUsage = {};
    if (!data.medicationUsage.dosage) data.medicationUsage.dosage = {};

    // Validate route if provided
    if (data.medicationUsage.dosage.route) {
      data.medicationUsage.dosage.route = this.validateEnum(
        data.medicationUsage.dosage.route,
        ['Oral', 'Intravenous', 'Intramuscular', 'Subcutaneous', 'Topical', 'Inhalation', 'Rectal', 'Vaginal', 'Nasal', 'Ophthalmic', 'Otic'],
        'Oral'
      );
    }

    // Validate patient info
    if (!data.patientInfo) data.patientInfo = {};
    if (data.patientInfo.gender) {
      data.patientInfo.gender = this.validateEnum(data.patientInfo.gender, ['male', 'female', 'other'], null);
    }

    return data;
  }

  /**
   * Validate enum values
   * @param {string} value - Value to validate
   * @param {Array} validValues - Array of valid values
   * @param {string} defaultValue - Default value if invalid
   * @returns {string} Validated value
   */
  validateEnum(value, validValues, defaultValue) {
    if (value && validValues.includes(value)) {
      return value;
    }
    return defaultValue;
  }

  /**
   * Get suggested medicines based on description using fuzzy matching
   * @param {string} description - Medicine description or name
   * @returns {Array} Array of suggested medicines with similarity scores
   */
  async suggestMedicines(description) {
    try {
      if (!description || description.trim().length === 0) {
        return [];
      }

      // Use fuzzy search to find matching medicines
      const suggestions = await fuzzySearchService.fuzzySearch(description, {
        maxResults: 10,
        minScore: 0.2,  // Lower threshold for suggestions
        includeExact: true,
        includeFuzzy: true
      });

      // Format suggestions for AI processing
      return suggestions.map(result => ({
        id: result.medicine._id,
        name: result.medicine.name,
        genericName: result.medicine.genericName,
        category: result.medicine.category,
        dosageForm: result.medicine.dosageForm,
        strength: result.medicine.strength,
        score: result.combinedScore,
        matchType: result.matchType,
        manufacturer: result.medicine.manufacturer?.name
      }));

    } catch (error) {
      console.error('Medicine suggestion error:', error);
      return [];
    }
  }

  /**
   * Enhanced medicine matching for AI-extracted data
   * @param {Object} extractedMedicine - Medicine data extracted by AI
   * @returns {Object} Best matching medicine with confidence score
   */
  async findBestMedicineMatch(extractedMedicine) {
    try {
      if (!extractedMedicine?.name) {
        return null;
      }

      // Try exact match first
      const exactMatches = await fuzzySearchService.findExactMatches(extractedMedicine.name);
      if (exactMatches.length > 0) {
        return {
          medicine: exactMatches[0],
          confidence: 1.0,
          matchType: 'exact',
          source: 'exact_name_match'
        };
      }

      // Try fuzzy matching
      const fuzzyResults = await fuzzySearchService.fuzzySearch(extractedMedicine.name, {
        maxResults: 5,
        minScore: 0.4,
        includeExact: true,
        includeFuzzy: true
      });

      if (fuzzyResults.length === 0) {
        return null;
      }

      const bestMatch = fuzzyResults[0];
      
      // Additional validation based on extracted data
      let confidenceBoost = 0;
      
      // Check if dosage form matches
      if (extractedMedicine.dosageForm && bestMatch.medicine.dosageForm) {
        const dosageFormMatch = extractedMedicine.dosageForm.toLowerCase() === 
          bestMatch.medicine.dosageForm.toLowerCase();
        if (dosageFormMatch) confidenceBoost += 0.1;
      }

      // Check if strength matches
      if (extractedMedicine.strength && bestMatch.medicine.strength) {
        const strengthMatch = this.compareStrengths(
          extractedMedicine.strength, 
          bestMatch.medicine.strength
        );
        if (strengthMatch) confidenceBoost += 0.1;
      }

      const finalConfidence = Math.min(1.0, bestMatch.combinedScore + confidenceBoost);

      return {
        medicine: bestMatch.medicine,
        confidence: finalConfidence,
        matchType: bestMatch.matchType,
        source: 'fuzzy_match',
        originalScore: bestMatch.combinedScore,
        boost: confidenceBoost
      };

    } catch (error) {
      console.error('Find best medicine match error:', error);
      return null;
    }
  }

  /**
   * Compare medicine strengths for similarity
   * @param {string|Object} strength1 - First strength value
   * @param {Object} strength2 - Second strength value with value and unit
   * @returns {boolean} Whether strengths are similar
   */
  compareStrengths(strength1, strength2) {
    try {
      // Extract numeric value from string if needed
      let value1, unit1;
      
      if (typeof strength1 === 'string') {
        const match = strength1.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)/);
        if (match) {
          value1 = parseFloat(match[1]);
          unit1 = match[2].toLowerCase();
        }
      } else if (typeof strength1 === 'object') {
        value1 = strength1.value;
        unit1 = strength1.unit?.toLowerCase();
      }

      const value2 = strength2.value;
      const unit2 = strength2.unit?.toLowerCase();

      // Compare units first
      if (unit1 && unit2 && unit1 !== unit2) {
        // Handle common unit conversions
        if ((unit1 === 'g' && unit2 === 'mg' && value1 * 1000 === value2) ||
            (unit1 === 'mg' && unit2 === 'g' && value1 === value2 * 1000)) {
          return true;
        }
        return false;
      }

      // Compare values with some tolerance
      if (value1 && value2) {
        const tolerance = 0.01; // 1% tolerance
        return Math.abs(value1 - value2) / Math.max(value1, value2) <= tolerance;
      }

      return false;
    } catch (error) {
      console.error('Compare strengths error:', error);
      return false;
    }
  }
}

module.exports = new AIService();