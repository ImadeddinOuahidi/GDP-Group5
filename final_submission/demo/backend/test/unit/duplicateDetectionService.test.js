const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateDuplicateScore,
  DUPLICATE_CONFIG
} = require('../../services/duplicateDetectionService');

function createReport({
  medicine = 'med-1',
  patient = 'patient-1',
  effects = [{ effect: 'Nausea', severity: 'Mild', onset: 'Within hours' }],
  incidentDate = '2026-04-10T12:00:00.000Z'
} = {}) {
  return {
    medicine,
    patient,
    sideEffects: effects,
    reportDetails: {
      incidentDate
    }
  };
}

test('duplicate detection gives a perfect score for identical reports', () => {
  const report1 = createReport();
  const report2 = createReport();

  const analysis = calculateDuplicateScore(report1, report2);

  assert.equal(analysis.score, 1);
  assert.equal(analysis.isPotentialDuplicate, true);
  assert.deepEqual(analysis.matchDetails, {
    sameMedicine: true,
    samePatient: true,
    symptomSimilarity: 1,
    dateProximity: 1
  });
  assert.ok(analysis.score >= DUPLICATE_CONFIG.SIMILARITY_THRESHOLD);
});

test('duplicate detection stays below the threshold for unrelated reports', () => {
  const report1 = createReport({
    medicine: 'med-1',
    patient: 'patient-1',
    effects: [{ effect: 'Nausea', severity: 'Mild', onset: 'Within hours' }],
    incidentDate: '2026-04-10T12:00:00.000Z'
  });

  const report2 = createReport({
    medicine: 'med-2',
    patient: 'patient-2',
    effects: [{ effect: 'Headache', severity: 'Severe', onset: 'Within days' }],
    incidentDate: '2026-02-01T12:00:00.000Z'
  });

  const analysis = calculateDuplicateScore(report1, report2);

  assert.equal(analysis.score, 0);
  assert.equal(analysis.isPotentialDuplicate, false);
  assert.deepEqual(analysis.matchDetails, {
    sameMedicine: false,
    samePatient: false,
    symptomSimilarity: 0,
    dateProximity: 0
  });
});

test('duplicate detection rewards partial matches without exceeding the threshold', () => {
  const report1 = createReport({
    medicine: 'med-1',
    patient: 'patient-1',
    effects: [{ effect: 'Dizziness', severity: 'Moderate', onset: 'Within days' }],
    incidentDate: '2026-04-10T12:00:00.000Z'
  });

  const report2 = createReport({
    medicine: 'med-1',
    patient: 'patient-2',
    effects: [{ effect: 'Dizziness', severity: 'Moderate', onset: 'Within days' }],
    incidentDate: '2026-04-11T12:00:00.000Z'
  });

  const analysis = calculateDuplicateScore(report1, report2);

  assert.equal(analysis.matchDetails.sameMedicine, true);
  assert.equal(analysis.matchDetails.samePatient, false);
  assert.equal(analysis.matchDetails.symptomSimilarity, 1);
  assert.equal(analysis.matchDetails.dateProximity, 1);
  assert.equal(analysis.score, 0.75);
  assert.equal(analysis.isPotentialDuplicate, true);
});
