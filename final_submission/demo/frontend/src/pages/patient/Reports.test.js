import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Reports from './Reports';
import { renderWithProviders } from '../../test/testUtils';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../../services', () => ({
  reportService: {
    getAllReports: jest.fn(),
  },
}));

import { reportService } from '../../services';

const reports = [
  {
    _id: 'report-1',
    medicine: { name: 'Ibuprofen', genericName: 'Ibuprofen' },
    medicationUsage: { dosage: { amount: '200mg' } },
    sideEffects: [{ effect: 'Headache', severity: 'Mild' }],
    status: 'pending',
    createdAt: '2026-04-01T10:00:00.000Z',
    reportDetails: { reportDate: '2026-04-01T10:00:00.000Z' },
  },
  {
    _id: 'report-2',
    medicine: { name: 'Amoxicillin', genericName: 'Amoxicillin' },
    medicationUsage: { dosage: { amount: '500mg' } },
    sideEffects: [{ effect: 'Rash', severity: 'Severe' }],
    status: 'under_review',
    createdAt: '2026-04-02T10:00:00.000Z',
    reportDetails: { reportDate: '2026-04-02T10:00:00.000Z' },
  },
  {
    _id: 'report-3',
    medicine: { name: 'Loratadine', genericName: 'Loratadine' },
    medicationUsage: { dosage: { amount: '10mg' } },
    sideEffects: [{ effect: 'Hives', severity: 'Moderate' }],
    status: 'reviewed',
    createdAt: '2026-04-03T10:00:00.000Z',
    reportDetails: { reportDate: '2026-04-03T10:00:00.000Z' },
  },
];

async function renderReports() {
  reportService.getAllReports.mockResolvedValueOnce({
    success: true,
    data: reports,
    meta: { pagination: { total: reports.length } },
  });

  renderWithProviders(<Reports />);

  await screen.findByText('Ibuprofen');
}

async function selectMuiOption(index, optionText) {
  fireEvent.mouseDown(screen.getAllByRole('combobox')[index]);
  const option = await screen.findByRole('option', { name: optionText });
  await userEvent.click(option);
}

describe('Reports', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('preferredLanguage', 'en');
    jest.clearAllMocks();
  });

  test('filters the report list by search, status, and severity', async () => {
    await renderReports();

    const searchInput = screen.getByPlaceholderText('Search reports by medicine or symptom');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'rash');

    await waitFor(() => {
      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.queryByText('Ibuprofen')).not.toBeInTheDocument();
      expect(screen.queryByText('Loratadine')).not.toBeInTheDocument();
    });

    await userEvent.clear(searchInput);
    await selectMuiOption(0, 'Under Review');
    await selectMuiOption(1, 'Severe');

    await waitFor(() => {
      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.queryByText('Ibuprofen')).not.toBeInTheDocument();
      expect(screen.queryByText('Loratadine')).not.toBeInTheDocument();
      expect(screen.getByText(/1 of 3 reports/i)).toBeInTheDocument();
    });
  });
});
