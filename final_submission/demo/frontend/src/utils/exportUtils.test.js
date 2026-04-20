import {
  exportClientCSV,
  exportClientJSON,
  generatePrintHTML,
} from './exportUtils';

describe('export and print utilities', () => {
  let createObjectURLMock;
  let revokeObjectURLMock;
  let originalBlob;

  beforeEach(() => {
    createObjectURLMock = jest.fn(() => 'blob:test');
    revokeObjectURLMock = jest.fn();
    originalBlob = global.Blob;

    global.Blob = class TestBlob {
      constructor(parts = [], options = {}) {
        this.parts = parts;
        this.type = options.type;
      }

      async text() {
        return this.parts.join('');
      }
    };

    Object.defineProperty(global.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURLMock,
    });

    Object.defineProperty(global.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURLMock,
    });
  });

  afterEach(() => {
    global.Blob = originalBlob;
  });

  test('generates printable HTML that includes the report summary, patient, and medication', () => {
    const html = generatePrintHTML({
      _id: 'rep-123',
      status: 'Submitted',
      priority: 'High',
      createdAt: '2026-03-29T10:15:00.000Z',
      patient: { firstName: 'Ada', lastName: 'Lovelace' },
      medicine: { name: 'Ibuprofen', genericName: 'Ibuprofen' },
      sideEffects: [{ effect: 'Nausea', severity: 'Mild', onset: 'Within hours' }],
      reportDetails: {
        incidentDate: '2026-03-28T10:15:00.000Z',
        reportDate: '2026-03-29T10:15:00.000Z',
        seriousness: 'Non-serious',
      },
      metadata: {
        aiAnalysis: {
          severity: { level: 'Moderate', confidence: '0.82' },
          summary: 'Monitor symptoms and maintain hydration.',
        },
      },
    });

    expect(html).toContain('SafeMed ADR - Adverse Drug Reaction Report');
    expect(html).toContain('rep-123');
    expect(html).toContain('Ada Lovelace');
    expect(html).toContain('Ibuprofen');
    expect(html).toContain('AI Severity Assessment');
  });

  test('exports client-side CSV data through a downloadable blob', async () => {
    exportClientCSV([
      {
        _id: 'rep-1',
        patient: { firstName: 'Ada', lastName: 'Lovelace' },
        medicine: { name: 'Ibuprofen' },
        sideEffects: [{ effect: 'Nausea', severity: 'Mild' }],
        status: 'Submitted',
        priority: 'High',
        reportDetails: { seriousness: 'Non-serious' },
        createdAt: '2026-03-29T10:15:00.000Z',
      },
    ], 'demo-export');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const csvBlob = createObjectURLMock.mock.calls[0][0];
    const csvText = await csvBlob.text();

    expect(csvText).toContain('Report ID,Patient,Medication');
    expect(csvText).toContain('"rep-1"');
    expect(csvText).toContain('"Ada Lovelace"');
    expect(csvText).toContain('"Ibuprofen"');
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test');
  });

  test('exports client-side JSON data through a downloadable blob', async () => {
    exportClientJSON([
      {
        _id: 'rep-2',
        status: 'Under Review',
        priority: 'Urgent',
        medicine: { name: 'Amoxicillin' },
        patient: { firstName: 'Grace', lastName: 'Hopper' },
        sideEffects: [{ effect: 'Rash', severity: 'Severe' }],
        reportDetails: { seriousness: 'Serious' },
        metadata: { aiAnalysis: { severity: { level: 'Severe' } } },
        createdAt: '2026-03-30T12:00:00.000Z',
      },
    ], 'demo-export');

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    const jsonBlob = createObjectURLMock.mock.calls[0][0];
    const jsonText = await jsonBlob.text();
    const parsed = JSON.parse(jsonText);

    expect(parsed.system).toBe('SafeMed ADR');
    expect(parsed.count).toBe(1);
    expect(parsed.reports[0]).toMatchObject({
      id: 'rep-2',
      medication: 'Amoxicillin',
      patient: 'Grace Hopper',
      status: 'Under Review',
    });
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:test');
  });
});
