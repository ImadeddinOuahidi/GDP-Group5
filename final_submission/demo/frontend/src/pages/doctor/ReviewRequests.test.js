import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReviewRequests from './ReviewRequests';

const mockNavigate = jest.fn();
const mockGetPendingReviews = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

jest.mock('../../services', () => ({
  reportService: {
    getPendingReviews: (...args) => mockGetPendingReviews(...args),
    submitDoctorReview: jest.fn(),
    reprocessAiAnalysis: jest.fn(),
    findDuplicates: jest.fn(),
    mergeDuplicate: jest.fn(),
    flagDuplicate: jest.fn(),
  },
}));

jest.mock('../../i18n', () => ({
  useI18n: () => ({
    locale: 'en',
    t: (key) => {
      const map = {
        'navigation.reviewRequests': 'Review Requests',
        'doctor.reviewRequestsSubtitle': 'Review queue',
        'dashboard.drugNameFilter': 'Drug Name',
        'dashboard.searchPlaceholder': 'Search drugs',
        'reports.severity': 'Severity',
        'common.all': 'All',
        'severity.lifeThreatening': 'Life-threatening',
        'severity.severe': 'Severe',
        'severity.moderate': 'Moderate',
        'severity.mild': 'Mild',
        'dashboard.dateFrom': 'Date From',
        'dashboard.dateTo': 'Date To',
        'doctor.clearFilters': 'Clear Filters',
        'doctor.noPendingReviews': 'No pending reviews',
        'doctor.noPendingReviewsDescription': 'No records',
      };
      return map[key] || key;
    },
  }),
}));

describe('ReviewRequests filters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPendingReviews.mockResolvedValue({
      success: true,
      data: { reports: [] },
    });
  });

  test('sends severity/date/drug filters to pending reviews API', async () => {
    render(<ReviewRequests />);

    await waitFor(() => {
      expect(mockGetPendingReviews).toHaveBeenCalledTimes(1);
    });

    await screen.findByLabelText('Drug Name');
    await screen.findByLabelText('Severity');

    fireEvent.change(screen.getByLabelText('Drug Name'), {
      target: { value: 'metformin' },
    });

    await waitFor(() => {
      expect(mockGetPendingReviews).toHaveBeenCalledTimes(2);
    });
    await screen.findByLabelText('Severity');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Severity' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Severe' }));

    await waitFor(() => {
      expect(mockGetPendingReviews).toHaveBeenCalledTimes(3);
    });
    await screen.findByLabelText('Date From');

    fireEvent.change(screen.getByLabelText('Date From'), {
      target: { value: '2026-01-01' },
    });

    await waitFor(() => {
      expect(mockGetPendingReviews).toHaveBeenCalledTimes(4);
    });
    await screen.findByLabelText('Date To');

    fireEvent.change(screen.getByLabelText('Date To'), {
      target: { value: '2026-12-31' },
    });

    await waitFor(() => {
      expect(mockGetPendingReviews).toHaveBeenCalledTimes(5);
      const lastCall = mockGetPendingReviews.mock.calls[mockGetPendingReviews.mock.calls.length - 1][0];
      expect(lastCall).toMatchObject({
        severity: 'Severe',
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        drugName: 'metformin',
      });
    });
  });
});
