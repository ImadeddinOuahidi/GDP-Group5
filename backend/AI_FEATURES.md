# AI-Powered Side Effect Reporting 🤖

This healthcare management system includes advanced AI-powered features for automatic side effect report generation using OpenAI's GPT-4 Vision and Whisper models.

## Features 🚀

### Multimodal Input Processing
- **Text Analysis**: Natural language processing for symptom descriptions
- **Image Analysis**: Computer vision for visual symptom identification (rashes, swelling, etc.)
- **Audio Transcription**: Speech-to-text for voice-recorded symptoms using Whisper

### AI Endpoints

#### 1. `/api/reports/aisubmit` - Full AI Processing
**POST** request with multipart form data:
```javascript
// Example usage
const formData = new FormData();
formData.append('text', 'I took paracetamol and developed severe nausea');
formData.append('images', imageFile1);
formData.append('images', imageFile2);
formData.append('audio', audioFile);
formData.append('autoSubmit', 'false');

fetch('/api/reports/aisubmit', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token },
  body: formData
});
```

#### 2. `/api/reports/aipreview` - Preview Mode
Same as aisubmit but only extracts data without saving to database.

#### 3. `/api/reports/aiconfirm` - Confirmed Submission
Submit AI-extracted data after user review and confirmation.

## Setup Instructions 🛠️

### 1. Install Dependencies
```bash
npm install multer openai sharp fluent-ffmpeg form-data
```

### 2. Environment Variables
Add to your `.env` file:
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# File Upload Configuration  
MAX_FILE_SIZE=10485760    # 10MB
MAX_AUDIO_SIZE=26214400   # 25MB
UPLOAD_DIR=./uploads
TEMP_DIR=./temp
```

### 3. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your environment variables

## Supported File Formats 📁

### Images (Max 5 files, 10MB each)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif) 
- WebP (.webp)

### Audio (1 file, 25MB max)
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- OGG (.ogg)
- WebM (.webm)

## AI Processing Flow 🔄

1. **Input Reception**: Accepts text, images, and/or audio
2. **Multimodal Processing**:
   - Text: Direct processing with GPT-4
   - Images: Analysis using GPT-4 Vision API
   - Audio: Transcription using Whisper API
3. **Data Extraction**: Structured extraction into report format
4. **Medicine Matching**: Automatic medicine database lookup
5. **Confidence Assessment**: AI confidence scoring (High/Medium/Low)
6. **Response Generation**: Structured JSON response with extracted data

## Example Response Structure 📋

```json
{
  "status": "success",
  "message": "Multimodal input processed successfully",
  "data": {
    "extractedData": {
      "medicine": {
        "name": "Paracetamol",
        "dosage": "500mg"
      },
      "sideEffects": [
        {
          "effect": "Severe nausea and vomiting",
          "severity": "Severe",
          "onset": "Within hours",
          "bodySystem": "Gastrointestinal"
        }
      ],
      "medicationUsage": {
        "indication": "Pain relief",
        "dosage": {
          "amount": "500mg",
          "frequency": "Twice daily",
          "route": "Oral"
        }
      },
      "reportDetails": {
        "seriousness": "Non-serious",
        "outcome": "Recovering"
      },
      "confidence": "High"
    },
    "suggestedMedicines": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Paracetamol 500mg Tablets",
        "genericName": "Paracetamol"
      }
    ],
    "foundMedicine": { /* Medicine object */ },
    "processingMetadata": {
      "confidence": "High",
      "inputTypes": {
        "text": true,
        "images": 2,
        "audio": true
      },
      "timestamp": "2023-12-07T10:30:00.000Z"
    }
  }
}
```

## Error Handling ⚠️

The system handles various error scenarios:

- **AI Service Unavailable** (503): Falls back to manual report submission
- **Rate Limiting** (429): Temporary throttling with retry suggestions
- **Invalid File Formats** (400): Clear error messages with supported formats
- **File Size Limits** (400): Specific size limit violations
- **Missing API Key** (503): Configuration error handling

## Usage Examples 💡

### Frontend Integration (React/JavaScript)
```javascript
// Example React component for AI report submission
const AIReportForm = () => {
  const [files, setFiles] = useState({});
  const [text, setText] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('text', text);
    
    if (files.images) {
      Array.from(files.images).forEach(img => {
        formData.append('images', img);
      });
    }
    
    if (files.audio) {
      formData.append('audio', files.audio);
    }
    
    try {
      const response = await fetch('/api/reports/aisubmit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const result = await response.json();
      console.log('AI Processing Result:', result);
    } catch (error) {
      console.error('AI Processing Error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your side effects..."
      />
      
      <input 
        type="file" 
        multiple 
        accept="image/*"
        onChange={(e) => setFiles({...files, images: e.target.files})}
      />
      
      <input 
        type="file" 
        accept="audio/*"
        onChange={(e) => setFiles({...files, audio: e.target.files[0]})}
      />
      
      <button type="submit">Process with AI</button>
    </form>
  );
};
```

### cURL Example
```bash
curl -X POST http://localhost:3000/api/reports/aisubmit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "text=I experienced dizziness after taking medication" \
  -F "images=@symptom_photo.jpg" \
  -F "audio=@symptom_description.mp3"
```

## Security & Privacy 🔒

- All uploads are processed in memory (no persistent file storage)
- Temporary files are automatically cleaned up
- File type validation prevents malicious uploads
- Size limits prevent DoS attacks
- JWT authentication required for all endpoints
- OpenAI API calls are logged for debugging (without sensitive data)

## Performance Considerations ⚡

- **Image Processing**: Images are compressed before API calls
- **Audio Processing**: Temporary file creation for Whisper API
- **Rate Limiting**: Built-in OpenAI API rate limit handling
- **Memory Management**: Files processed in memory to avoid disk I/O
- **Concurrent Processing**: Multiple input types processed in parallel

## Testing the AI Features 🧪

### 1. Manual Testing
Use the Swagger UI at `/api-docs` to test the endpoints interactively.

### 2. Postman Collection
Import the API collection and test with sample files.

### 3. Sample Test Cases
```javascript
// Test case 1: Text only
POST /api/reports/aipreview
FormData: { text: "Severe headache after taking aspirin" }

// Test case 2: Image only  
POST /api/reports/aipreview
FormData: { images: [rash_photo.jpg] }

// Test case 3: Audio only
POST /api/reports/aipreview  
FormData: { audio: description.mp3 }

// Test case 4: All inputs
POST /api/reports/aisubmit
FormData: { 
  text: "Side effect description",
  images: [photo1.jpg, photo2.png],
  audio: voice_note.wav,
  autoSubmit: false 
}
```

## Troubleshooting 🔧

### Common Issues
1. **"AI service unavailable"**: Check OpenAI API key configuration
2. **File upload errors**: Verify file size and format limits  
3. **Processing timeouts**: Large files may take longer to process
4. **Rate limiting**: Wait before retrying or implement exponential backoff

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## Future Enhancements 🔮

- Support for additional image formats (DICOM, HEIC)
- Real-time processing status updates via WebSocket
- Batch processing for multiple reports
- Integration with medical terminology APIs (SNOMED CT)
- Multi-language support for international users
- Advanced image analysis with specialized medical vision models

---

**Note**: This AI feature requires an active OpenAI API subscription. Usage costs apply based on OpenAI's pricing for GPT-4 Vision and Whisper APIs.