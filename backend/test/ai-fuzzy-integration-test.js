/**
 * Test file for AI Service integration with Fuzzy Search Service
 * Tests the enhanced medicine matching capabilities in multimodal report processing
 */

const AIService = require('../services/aiService');
const fuzzySearchService = require('../services/fuzzySearchService');
require('dotenv').config();

// Mock console to reduce noise during testing
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = () => {};
console.error = () => {};

async function runIntegrationTests() {
  try {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    console.log('🔬 Starting AI Service + Fuzzy Search Integration Tests\n');

    const aiService = new AIService();

    // Test 1: Medicine Suggestions
    console.log('📋 Test 1: Medicine Suggestions with Fuzzy Matching');
    try {
      const suggestions = await aiService.suggestMedicines('acetaminofen'); // Common misspelling
      console.log(`✓ Found ${suggestions.length} suggestions for "acetaminofen"`);
      if (suggestions.length > 0) {
        console.log(`  - Top suggestion: ${suggestions[0].name} (Score: ${suggestions[0].score})`);
      }
    } catch (error) {
      console.log(`✗ Suggestion test failed: ${error.message}`);
    }

    console.log('');

    // Test 2: Best Medicine Match
    console.log('📋 Test 2: Best Medicine Match with Validation');
    try {
      const testMedicine = {
        name: 'ibuprofen',
        dosageForm: 'tablet',
        strength: '200mg'
      };
      
      const bestMatch = await aiService.findBestMedicineMatch(testMedicine);
      if (bestMatch) {
        console.log(`✓ Best match found: ${bestMatch.medicine.name}`);
        console.log(`  - Confidence: ${bestMatch.confidence}`);
        console.log(`  - Match Type: ${bestMatch.matchType}`);
        console.log(`  - Source: ${bestMatch.source}`);
      } else {
        console.log('✗ No match found for ibuprofen');
      }
    } catch (error) {
      console.log(`✗ Best match test failed: ${error.message}`);
    }

    console.log('');

    // Test 3: Strength Comparison
    console.log('📋 Test 3: Medicine Strength Comparison');
    try {
      const strength1 = '200mg';
      const strength2 = { value: 200, unit: 'mg' };
      const isMatch = aiService.compareStrengths(strength1, strength2);
      console.log(`✓ Strength comparison ("200mg" vs {value: 200, unit: "mg"}): ${isMatch ? 'Match' : 'No Match'}`);

      // Test unit conversion
      const strength3 = '1g';
      const strength4 = { value: 1000, unit: 'mg' };
      const isConversionMatch = aiService.compareStrengths(strength3, strength4);
      console.log(`✓ Unit conversion ("1g" vs {value: 1000, unit: "mg"}): ${isConversionMatch ? 'Match' : 'No Match'}`);
    } catch (error) {
      console.log(`✗ Strength comparison test failed: ${error.message}`);
    }

    console.log('');

    // Test 4: Simulated Multimodal Processing (without actual OpenAI calls)
    console.log('📋 Test 4: Simulated Medicine Enhancement in Report');
    try {
      // Create a mock structured data that would come from AI extraction
      const mockStructuredData = {
        medicine: {
          name: 'tylenol', // Brand name that should match to acetaminophen
          dosage: '500mg'
        },
        sideEffects: [
          {
            effect: 'Nausea',
            severity: 'Mild'
          }
        ]
      };

      console.log('🧪 Testing medicine enhancement logic...');
      
      // Test the medicine matching part
      if (mockStructuredData.medicine && mockStructuredData.medicine.name) {
        const medicineMatch = await aiService.findBestMedicineMatch(mockStructuredData.medicine);
        if (medicineMatch && medicineMatch.confidence >= 0.4) {
          mockStructuredData.medicine = {
            ...mockStructuredData.medicine,
            matchedMedicine: medicineMatch.medicine,
            matchConfidence: medicineMatch.confidence,
            matchType: medicineMatch.matchType,
            matchSource: medicineMatch.source,
            originalExtracted: { ...mockStructuredData.medicine }
          };
          console.log(`✓ Enhanced medicine data for "${mockStructuredData.medicine.originalExtracted.name}"`);
          console.log(`  - Matched to: ${medicineMatch.medicine.name}`);
          console.log(`  - Confidence: ${medicineMatch.confidence}`);
        } else {
          // If no good match found, get suggestions
          const suggestions = await aiService.suggestMedicines(mockStructuredData.medicine.name);
          if (suggestions.length > 0) {
            mockStructuredData.medicine.suggestions = suggestions.slice(0, 5);
            console.log(`✓ Added ${suggestions.length} medicine suggestions`);
          }
        }
      }
    } catch (error) {
      console.log(`✗ Simulated processing test failed: ${error.message}`);
    }

    console.log('\n🎉 Integration tests completed!');
    console.log('\n💡 Ready to test with real multimodal inputs via API endpoints');

  } catch (error) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.error('❌ Integration test error:', error);
  }
}

// Export for use in other test files or run directly
if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };