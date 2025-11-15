# AI Severity Analysis System

## Overview

The AI Severity Analysis system automatically processes side effect reports using OpenAI's GPT-4 model to determine severity levels, priority, and recommended actions. The system runs as a background job and provides both automatic and manual analysis capabilities.

## Architecture

### Components

1. **Background Job Service** (`jobs/severityAnalysisJob.js`)
   - Processes reports asynchronously
   - Integrates with OpenAI GPT-4 Turbo Preview
   - Implements rate limiting and retry logic
   - Provides fallback rule-based analysis

2. **Controller** (`controllers/severityAnalysisController.js`)
   - Exposes API endpoints for severity analysis
   - Handles manual triggers and status checks
   - Provides batch processing and statistics

3. **Routes** (`routes/reports.js`)
   - POST `/:id/analyze-severity` - Manual analysis trigger
   - GET `/:id/severity-status` - Check analysis status
   - POST `/batch-analyze` - Batch process multiple reports
   - GET `/analysis-stats` - System statistics

4. **Data Model** (`models/ReportSideEffect.js`)
   - `metadata` field tracks AI processing status
   - `aiAnalysis` sub-document stores analysis results

## How It Works

### Automatic Analysis

When a patient creates a new side effect report:

1. Report is saved to database
2. Background job is triggered via `setImmediate()`
3. Job processes report in separate event loop tick (non-blocking)
4. AI analyzes the report using OpenAI GPT-4
5. Results are saved to `metadata.aiAnalysis` field
6. Status updates include processing timestamps and confidence scores

### Manual Analysis

Doctors can trigger re-analysis:

```javascript
POST /api/reports/:id/analyze-severity
Authorization: Bearer <token>
```

### Batch Processing

Process multiple reports at once:

```javascript
POST /api/reports/batch-analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportIds": ["64f1a2b3c4d5e6f7g8h9i0j1", "64f1a2b3c4d5e6f7g8h9i0j2"]
}
```

## AI Analysis Output

The AI provides:

- **Overall Severity**: mild, moderate, severe, life-threatening
- **Priority Level**: low, medium, high, urgent
- **Seriousness Classification**: serious, non-serious
- **Confidence Score**: 0-100
- **Reasoning**: Detailed explanation
- **Recommended Actions**: Array of suggested steps
- **Risk Factors**: Identified risk factors
- **Requires Immediate Attention**: Boolean flag

### Example Response

```json
{
  "success": true,
  "data": {
    "report": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "medicine": "...",
      "description": "Severe headache and nausea",
      "metadata": {
        "aiProcessed": true,
        "aiProcessedAt": "2024-01-15T10:30:00.000Z",
        "aiAnalysis": {
          "overallSeverity": "moderate",
          "priorityLevel": "high",
          "seriousnessClassification": "non-serious",
          "confidenceScore": 87,
          "reasoning": "The symptoms indicate moderate severity...",
          "recommendedActions": [
            "Monitor patient closely",
            "Consider dose adjustment",
            "Schedule follow-up within 48 hours"
          ],
          "riskFactors": ["Previous history of migraines"],
          "requiresImmediateAttention": false,
          "analyzedAt": "2024-01-15T10:30:00.000Z",
          "model": "gpt-4-turbo-preview"
        }
      }
    }
  }
}
```

## Configuration

### Environment Variables

Add to `.env` file:

```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### Rate Limiting

The system implements rate limiting for OpenAI API calls:
- 1 second delay between batch requests
- Automatic retry on rate limit errors (3 attempts)
- Exponential backoff for retries

## Fallback Logic

If OpenAI API is unavailable, the system uses rule-based analysis:

1. Analyzes symptom keywords (severe, intense, unbearable, etc.)
2. Checks patient history
3. Assigns severity based on predefined rules
4. Sets lower confidence score (60)

## Error Handling

The system handles:
- OpenAI API errors (rate limits, timeouts)
- Invalid report data
- Network failures
- Missing required fields

Errors are logged and stored in `metadata.aiProcessingError`.

## Monitoring

### Check Analysis Status

```javascript
GET /api/reports/:id/severity-status
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "reportId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "aiProcessed": true,
    "analyzedAt": "2024-01-15T10:30:00.000Z",
    "confidenceScore": 87,
    "overallSeverity": "moderate",
    "priorityLevel": "high"
  }
}
```

### System Statistics

```javascript
GET /api/reports/analysis-stats
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "totalReports": 150,
    "analyzed": 145,
    "pending": 5,
    "failed": 0,
    "averageConfidence": 85.3,
    "severityBreakdown": {
      "mild": 45,
      "moderate": 70,
      "severe": 25,
      "life-threatening": 5
    },
    "priorityBreakdown": {
      "low": 50,
      "medium": 60,
      "high": 30,
      "urgent": 5
    }
  }
}
```

## Best Practices

1. **Monitor Processing**: Check analysis stats regularly
2. **Review High Priority**: Focus on reports marked as "urgent" or "high" priority
3. **Validate AI Results**: Use AI as assistance, not replacement for medical judgment
4. **Batch Process**: Use batch analysis for existing reports
5. **Set OpenAI Budget**: Configure OpenAI API budget limits

## Troubleshooting

### Reports Not Being Analyzed

1. Check OpenAI API key is configured
2. Verify API key has sufficient credits
3. Check backend logs for errors
4. Try manual analysis trigger

### Low Confidence Scores

1. Review report description quality
2. Check if patient history is available
3. Verify medicine information is complete
4. Consider fallback analysis indicators

### Rate Limit Errors

1. Reduce batch size
2. Increase delay between requests
3. Check OpenAI API tier limits
4. Consider upgrading OpenAI plan

## Future Enhancements

- [ ] Support for multiple AI models (Claude, Gemini)
- [ ] Custom severity classification rules per organization
- [ ] Learning from doctor feedback
- [ ] Trend analysis across reports
- [ ] Predictive analytics for severity escalation
- [ ] Real-time notifications for urgent cases
- [ ] Integration with electronic health records (EHR)

## API Reference

### POST /:id/analyze-severity
**Description**: Manually trigger severity analysis for a report  
**Auth**: Required (doctor/admin)  
**Parameters**: Report ID in URL  
**Response**: Updated report with AI analysis  

### GET /:id/severity-status
**Description**: Get current analysis status  
**Auth**: Required  
**Parameters**: Report ID in URL  
**Response**: Analysis status and metadata  

### POST /batch-analyze
**Description**: Analyze multiple reports  
**Auth**: Required (doctor/admin)  
**Body**: `{ reportIds: string[] }`  
**Response**: Batch processing results  

### GET /analysis-stats
**Description**: Get system-wide statistics  
**Auth**: Required (doctor/admin)  
**Response**: Analysis statistics and breakdowns  

## Security Considerations

- OpenAI API key stored in environment variables
- All endpoints require authentication
- Rate limiting prevents abuse
- Patient data anonymized in AI prompts
- Audit trail maintained in metadata
- HIPAA compliance considerations for PHI

## Performance

- Average analysis time: 2-5 seconds per report
- Non-blocking architecture (uses setImmediate)
- Batch processing: ~1 second delay between reports
- Memory efficient (streams large datasets)
- Scalable to thousands of reports

## Testing

Run the integration tests:

```bash
cd backend
npm test -- test/ai-fuzzy-integration-test.js
```

## Support

For issues or questions:
1. Check backend logs
2. Review OpenAI API status page
3. Consult team documentation
4. Contact system administrator

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Development Team
