const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

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
   * Get suggested medicines based on description
   * @param {string} description - Medicine description
   * @returns {Array} Array of suggested medicine IDs
   */
  async suggestMedicines(description) {
    try {
      // This would typically involve a medicine database search
      // For now, we'll return a placeholder
      return [];
    } catch (error) {
      console.error('Medicine suggestion error:', error);
      return [];
    }
  }
}

module.exports = new AIService();