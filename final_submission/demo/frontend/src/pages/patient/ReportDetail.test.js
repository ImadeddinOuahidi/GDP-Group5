import React from 'react';
import { screen } from '@testing-library/react';
import ReportDetail from './ReportDetail';
import { renderWithProviders } from '../../test/testUtils';
import { reportService } from '../../services';

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useParams: () => ({ id: 'report-42' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../../services', () => ({
  reportService: {
    getReportById: jest.fn(),
    requestDoctorReview: jest.fn(),
  },
}));

jest.mock('../../utils/exportUtils', () => ({
  printReport: jest.fn(),
  exportClientJSON: jest.fn(),
}));

const report = {
  _id: 'report-42',
  status: 'Reviewed',
  medicine: { name: 'Ibuprofen', genericName: 'Ibuprofen' },
  sideEffects: [
    {
      effect: 'Nausea',
      severity: 'Moderate',
      description: 'Started after the first dose.',
      onset: 'Within hours',
      bodySystem: 'Gastrointestinal',
    },
  ],
  medicationUsage: {
    dosage: {
      amount: '200mg',
      frequency: 'twice daily',
      route: 'Oral',
    },
    indication: 'Pain relief',
  },
  createdAt: '2026-04-03T10:00:00.000Z',
  metadata: {
    aiProcessed: true,
    aiAnalysis: {
      patientGuidance: {
        urgencyLevel: 'soon',
        recommendation: 'Monitor symptoms and follow up if they worsen.',
        nextSteps: ['Take with food'],
        warningSignsToWatch: ['Persistent vomiting'],
        shouldSeekMedicalAttention: true,
      },
      summary: 'The reaction appears manageable with monitoring.',
    },
  },
  statusHistory: [
    {
      status: 'Submitted',
      changedAt: '2026-04-03T10:00:00.000Z',
      changedBy: { firstName: 'System' },
      note: 'Initial submission recorded.',
    },
    {
      status: 'Under Review',
      changedAt: '2026-04-04T10:00:00.000Z',
      changedBy: { firstName: 'Dr', lastName: 'Ng' },
      note: 'Assigned to a doctor for review.',
    },
  ],
  doctorReview: {
    requested: true,
    status: 'completed',
    reviewedBy: { firstName: 'Mina', lastName: 'Patel' },
    reviewedAt: '2026-04-05T10:00:00.000Z',
    remarks: 'Continue monitoring and book a follow-up if symptoms return.',
    doctorAssessment: {
      recommendation: 'Safe to continue with monitoring.',
      actionRequired: 'follow_up',
      followUpRequired: true,
      followUpDate: '2026-04-12T10:00:00.000Z',
    },
  },
};

describe('ReportDetail', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('preferredLanguage', 'en');
    jest.clearAllMocks();
  });

  test('shows the report status timeline and doctor review details for patient status checking', async () => {
    reportService.getReportById.mockResolvedValueOnce({
      success: true,
      data: { report },
    });

    renderWithProviders(<ReportDetail />);

    expect(await screen.findByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText('Status Timeline')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Under Review')).toBeInTheDocument();
    expect(screen.getByText('Reviewed by Dr. Mina Patel')).toBeInTheDocument();
    expect(screen.getByText('Doctor Review')).toBeInTheDocument();
    expect(screen.getByText("Doctor's Remarks")).toBeInTheDocument();
    expect(screen.getByText('The reaction appears manageable with monitoring.')).toBeInTheDocument();
  });
});
