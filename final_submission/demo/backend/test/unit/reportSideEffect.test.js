const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const ReportSideEffect = require('../../models/ReportSideEffect');

function buildValidReport(overrides = {}) {
  return new ReportSideEffect({
    reportedBy: new mongoose.Types.ObjectId(),
    reporterRole: 'patient',
    medicine: new mongoose.Types.ObjectId(),
    sideEffects: [
      {
        effect: 'Nausea',
        severity: 'Severe',
        onset: 'Immediate'
      }
    ],
    medicationUsage: {
      indication: 'Pain relief',
      dosage: {
        amount: '1 tablet',
        frequency: 'Daily',
        route: 'Oral'
      },
      startDate: new Date('2026-04-01T12:00:00.000Z')
    },
    reportDetails: {
      incidentDate: new Date('2026-04-02T12:00:00.000Z'),
      seriousness: 'Serious',
      outcome: 'Recovering'
    },
    ...overrides
  });
}

test('ReportSideEffect applies report date and timestamp defaults at construction time', () => {
  const startedAt = Date.now();
  const report = buildValidReport();

  assert.ok(report.reportDetails.reportDate instanceof Date);
  assert.ok(report.createdAt instanceof Date);
  assert.ok(report.updatedAt instanceof Date);
  assert.ok(Math.abs(report.reportDetails.reportDate.getTime() - startedAt) < 5000);
  assert.ok(Math.abs(report.createdAt.getTime() - startedAt) < 5000);
  assert.ok(Math.abs(report.updatedAt.getTime() - startedAt) < 5000);
  assert.equal(report.status, 'Draft');
  assert.equal(report.priority, 'Medium');
  assert.equal(report.reportDetails.reportType, 'Spontaneous');
});

test('ReportSideEffect save hook records the initial status and elevates critical reports', async () => {
  const originalReadyState = ReportSideEffect.db.readyState;
  const originalConnReadyState = ReportSideEffect.collection.conn.readyState;
  const originalInsertOne = ReportSideEffect.collection.insertOne;

  ReportSideEffect.db.readyState = 1;
  ReportSideEffect.collection.conn.readyState = 1;
  ReportSideEffect.collection.insertOne = async function insertOne(doc) {
    return { insertedId: doc._id };
  };

  try {
    const report = buildValidReport();

    await report.save();

    assert.equal(report.statusHistory.length, 1);
    assert.equal(report.statusHistory[0].status, 'Draft');
    assert.equal(report.statusHistory[0].note, 'Initial status');
    assert.ok(report.statusHistory[0].changedAt instanceof Date);
    assert.equal(report.priority, 'Critical');
    assert.ok(report.updatedAt instanceof Date);
  } finally {
    ReportSideEffect.collection.insertOne = originalInsertOne;
    ReportSideEffect.db.readyState = originalReadyState;
    ReportSideEffect.collection.conn.readyState = originalConnReadyState;
  }
});
