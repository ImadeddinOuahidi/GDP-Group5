import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

jest.mock('../../services/apiClient', () => ({
  api: {
    reports: {
      getAll: jest.fn(),
      getDashboard: jest.fn(),
    },
  },
}));

jest.mock('../../utils/exportUtils', () => ({
  exportReportsCSV: jest.fn(),
  exportReportsJSON: jest.fn(),
  exportClientCSV: jest.fn(),
  exportClientJSON: jest.fn(),
}));

jest.mock('../../i18n', () => ({
  useI18n: () => ({
    t: (key, variables = {}) => {
      const map = {
        'doctor.analyticsDashboard': 'Analytics Dashboard',
        'dashboard.comprehensiveAnalytics': 'Comprehensive analytics',
        'dashboard.totalReports': 'Total Reports',
        'dashboard.criticalCases': 'Critical Cases',
        'dashboard.activePatients': 'Active Patients',
        'dashboard.monitoredDrugs': 'Monitored Drugs',
        'dashboard.thisMonth': 'This month',
        'dashboard.requiresAttention': 'Requires attention',
        'dashboard.underMonitoring': 'Under monitoring',
        'dashboard.inDatabase': 'In database',
        'dashboard.refreshError': 'Refresh error',
        'dashboard.recentReports': 'Recent Reports',
        'dashboard.comprehensiveList': 'Comprehensive list',
        'dashboard.lastUpdated': `Last updated ${variables.time || ''}`.trim(),
        'dashboard.searchPlaceholder': 'Search patients, drugs, symptoms...',
        'reports.severity': 'Severity',
        'common.all': 'All',
        'severity.lifeThreatening': 'Life-threatening',
        'severity.severe': 'Severe',
        'severity.moderate': 'Moderate',
        'severity.mild': 'Mild',
        'dashboard.dateFrom': 'Date From',
        'dashboard.dateTo': 'Date To',
        'doctor.clearFilters': 'Clear Filters',
        'reports.reportId': 'Report ID',
        'reports.patient': 'Patient',
        'reports.drug': 'Drug',
        'reports.symptoms': 'Symptoms',
        'reports.status': 'Status',
        'reports.reportDate': 'Report Date',
        'reports.actions': 'Actions',
        'common.anonymous': 'Anonymous',
        'common.unknown': 'Unknown',
        'common.notAvailable': 'N/A',
        'status.submitted': 'Submitted',
        'reports.viewDetails': 'View details',
        'reports.exportReport': 'Export report',
        'reports.reportsShown': `${variables.filtered} of ${variables.total} reports shown`,
        'dashboard.reportsOverTime': 'Reports Over Time',
        'dashboard.dailyTrend': 'Daily Trend',
        'dashboard.reportCountLabel': `${variables.count} report(s)`,
        'dashboard.reports': 'Reports',
        'dashboard.severityDistribution': 'Severity Distribution',
        'dashboard.aiAssessedCount': `${variables.count} AI assessed`,
        'dashboard.patientReportedSeverity': 'Patient reported severity',
        'dashboard.recentActivity': 'Recent Activity',
        'dashboard.noReportsYet': 'No Reports Yet',
        'doctor.topMedicationsByReportCount': 'Top Medications By Report Count',
        'dashboard.medicationsHighestCount': 'Medications with highest count',
        'dashboard.refreshingData': 'Refreshing data',
        'dashboard.refreshingDataDescription': 'Refreshing data description',
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

jest.mock('recharts', () => {
  const React = require('react');

  return {
    AreaChart: ({ data }) => <div data-testid="area-chart" data-points={String(data?.length || 0)} />,
    Area: () => <div data-testid="area-series" />,
    BarChart: ({ data }) => <div data-testid="bar-chart" data-points={String(data?.length || 0)} />,
    Bar: () => <div data-testid="bar-series" />,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children, data }) => <div data-testid="pie-series" data-points={String(data?.length || 0)}>{children}</div>,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    Legend: () => null,
  };
});

import { api } from '../../services/apiClient';
import Dashboard from './Dashboard';

const sampleReports = [
  {
    _id: 'report-1',
    createdAt: '2026-04-10T12:00:00.000Z',
    patient: { _id: 'patient-1', firstName: 'Alice', lastName: 'Jones' },
    medicine: { _id: 'med-1', name: 'Ibuprofen' },
    sideEffects: [{ effect: 'Nausea', severity: 'Severe', onset: 'Immediate' }],
    status: 'Submitted',
    priority: 'High',
    metadata: { aiProcessed: true, aiAnalysis: { severity: { level: 'Severe' } } },
  },
  {
    _id: 'report-2',
    createdAt: '2026-04-02T12:00:00.000Z',
    patient: { _id: 'patient-2', firstName: 'Bob', lastName: 'Smith' },
    medicine: { _id: 'med-2', name: 'Amoxicillin' },
    sideEffects: [{ effect: 'Rash', severity: 'Mild', onset: 'Within days' }],
    status: 'Reviewed',
    priority: 'Low',
    metadata: {},
  },
  {
    _id: 'report-3',
    createdAt: '2026-04-14T12:00:00.000Z',
    patient: { _id: 'patient-3', firstName: 'Carla', lastName: 'Diaz' },
    medicine: { _id: 'med-3', name: 'Metformin' },
    sideEffects: [{ effect: 'Headache', severity: 'Moderate', onset: 'Within hours' }],
    status: 'Under Review',
    priority: 'Medium',
    metadata: {},
  },
];

const dashboardStats = {
  totalReports: 3,
  seriousReports: 1,
  severeCaseCount: 1,
  aiProcessedCount: 1,
  reportsOverTime: [
    { date: '2026-04-10', count: 1 },
    { date: '2026-04-14', count: 1 },
  ],
  aiSeverityDistribution: [
    { _id: 'Severe', count: 1 },
    { _id: 'Moderate', count: 1 },
    { _id: 'Mild', count: 1 },
  ],
  mostReportedMedicines: [
    { medicineName: 'Ibuprofen', reportCount: 1 },
    { medicineName: 'Amoxicillin', reportCount: 1 },
    { medicineName: 'Metformin', reportCount: 1 },
  ],
};

describe('Dashboard functional requirements coverage', () => {
  beforeAll(() => {
    if (!window.matchMedia) {
      window.matchMedia = () => ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    api.reports.getAll.mockImplementation((params = {}) => {
      const filtered = sampleReports.filter((report) => {
        const drugName = report.medicine?.name || '';
        const incidentDate = report.createdAt;

        const matchesDrugName = !params.drugName || drugName.toLowerCase().includes(params.drugName.toLowerCase());
        const matchesSeverity = !params.severity || report.metadata?.aiAnalysis?.severity?.level === params.severity || report.sideEffects?.some((effect) => effect.severity === params.severity);
        const matchesFromDate = !params.fromDate || new Date(incidentDate) >= new Date(params.fromDate);
        const matchesToDate = !params.toDate || new Date(incidentDate) <= new Date(`${params.toDate}T23:59:59`);

        return matchesDrugName && matchesSeverity && matchesFromDate && matchesToDate;
      });

      return Promise.resolve({
        data: {
          data: filtered,
          meta: {
            pagination: {
              total: filtered.length,
            },
          },
        },
      });
    });
    api.reports.getDashboard.mockResolvedValue({ data: { data: dashboardStats } });
  });

  test('filters reports by drug-name search', async () => {
    render(<Dashboard />);

    await screen.findByText('Alice Jones');
    const table = screen.getByRole('table');
    const tableQueries = within(table);

    fireEvent.change(
      screen.getByPlaceholderText(/search patients, drugs, symptoms/i),
      { target: { value: 'ibuprofen' } }
    );

    await waitFor(() => {
      expect(tableQueries.getByText('Ibuprofen')).toBeInTheDocument();
      expect(tableQueries.queryByText('Amoxicillin')).not.toBeInTheDocument();
      expect(tableQueries.queryByText('Metformin')).not.toBeInTheDocument();
    });
  });

  test('filters reports by severity and date range', async () => {
    render(<Dashboard />);

    await screen.findByText('Alice Jones');
    const table = screen.getByRole('table');
    const tableQueries = within(table);

    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByRole('option', { name: 'Severe' }));

    fireEvent.change(screen.getByLabelText('Date From'), {
      target: { value: '2026-04-09' },
    });
    fireEvent.change(screen.getByLabelText('Date To'), {
      target: { value: '2026-04-11' },
    });

    await waitFor(() => {
      expect(tableQueries.getByText('Alice Jones')).toBeInTheDocument();
      expect(tableQueries.queryByText('Bob Smith')).not.toBeInTheDocument();
      expect(tableQueries.queryByText('Carla Diaz')).not.toBeInTheDocument();
    });
  });

  test('renders chart sections for trends, severity distribution, and top medications', async () => {
    render(<Dashboard />);

    await screen.findByText('Reports Over Time');

    expect(screen.getByText('Severity Distribution')).toBeInTheDocument();
    expect(screen.getByText('Top Medications By Report Count')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toHaveAttribute('data-points', '30');
    expect(screen.getByTestId('pie-series')).toHaveAttribute('data-points', '3');
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-points', '3');
  });
});
