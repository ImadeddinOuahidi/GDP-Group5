const test = require('node:test');
const assert = require('node:assert/strict');

process.env.GEMINI_API_KEY = '';

const aiService = require('../../services/aiService');

test('aiService returns a default extraction when no input is provided', async () => {
  const result = await aiService.processMultimodalInput({});

  assert.deepEqual(result.medicine, { name: null, genericName: null });
  assert.equal(result.confidence, 'Low');
  assert.equal(result.reportDetails.seriousness, 'Non-serious');
  assert.equal(result.sideEffects.length, 1);
  assert.equal(result.sideEffects[0].effect, 'Not specified');
});

test('aiService falls back to heuristic parsing for plain text input', async () => {
  const text = 'I took ibuprofen 200 mg and immediately developed severe nausea after an IV treatment.';

  const result = await aiService.processMultimodalInput({ text });

  assert.deepEqual(result.medicine, { name: 'ibuprofen', genericName: null });
  assert.equal(result.sideEffects[0].severity, 'Severe');
  assert.equal(result.sideEffects[0].onset, 'Immediate');
  assert.equal(result.medicationUsage.dosage.route, 'Intravenous');
  assert.equal(result.reportDetails.seriousness, 'Serious');
  assert.equal(result.confidence, 'Medium');
  assert.match(result.sideEffects[0].effect.toLowerCase(), /ibuprofen 200 mg/i);
});

test('aiService keeps a low-confidence response when the text is too vague', async () => {
  const result = await aiService.processMultimodalInput({ text: 'Felt bad.' });

  assert.equal(result.medicine.name, null);
  assert.equal(result.confidence, 'Low');
  assert.equal(result.sideEffects[0].severity, 'Moderate');
  assert.equal(result.sideEffects[0].onset, 'Unknown');
});
