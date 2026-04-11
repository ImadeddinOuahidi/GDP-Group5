jest.mock('../config/constants', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      REPORTS: '/reports',
      PENDING_REVIEWS: '/reports/pending-reviews',
      AI_SUBMIT: '/reports/aisubmit',
      AI_CONFIRM: '/reports/aiconfirm',
    },
  },
}));

jest.mock('./apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from './apiClient';
import { reportService } from './reportService';

describe('mobile reportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits reports and fetches dashboard stats from the configured endpoints', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { success: true, data: { _id: 'report-1' } },
    });
    apiClient.get.mockResolvedValueOnce({
      data: { success: true, data: { totalReports: 2 } },
    });

    await reportService.submitReport({ medicine: 'ibuprofen' });
    await reportService.getDashboardStats();

    expect(apiClient.post).toHaveBeenCalledWith('/reports', { medicine: 'ibuprofen' });
    expect(apiClient.get).toHaveBeenCalledWith('/reports/dashboard');
  });

  test('checks duplicates and falls back cleanly when the request fails', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { success: true, data: { hasPotentialDuplicates: true } },
    });
    apiClient.post.mockRejectedValueOnce(new Error('offline'));

    const ok = await reportService.checkDuplicates({ medicine: 'ibuprofen' });
    const fallback = await reportService.checkDuplicates({ medicine: 'paracetamol' });

    expect(ok).toEqual({ success: true, data: { hasPotentialDuplicates: true } });
    expect(fallback.success).toBe(false);
    expect(fallback.data.duplicates).toEqual([]);
  });

  test('updates report status and retrieves a report by id', async () => {
    apiClient.put.mockResolvedValueOnce({ data: { success: true } });
    apiClient.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: 'report-9', status: 'Reviewed' } },
    });

    await reportService.updateReportStatus('report-9', { status: 'Reviewed' });
    const report = await reportService.getReportById('report-9');

    expect(apiClient.put).toHaveBeenCalledWith('/reports/report-9/status', { status: 'Reviewed' });
    expect(apiClient.get).toHaveBeenCalledWith('/reports/report-9');
    expect(report).toEqual({ success: true, data: { _id: 'report-9', status: 'Reviewed' } });
  });

  test('supports duplicate workflows used by report review screens', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { success: true, data: { duplicates: [{ _id: 'dup-1' }] } },
    });
    apiClient.post.mockResolvedValueOnce({
      data: { success: true, data: { merged: true } },
    });

    const duplicates = await reportService.findDuplicates('report-9');
    const merge = await reportService.mergeDuplicate('report-9', 'report-1');

    expect(apiClient.get).toHaveBeenCalledWith('/reports/report-9/duplicates');
    expect(apiClient.post).toHaveBeenCalledWith('/reports/report-9/merge-duplicate', {
      originalReportId: 'report-1',
    });
    expect(duplicates).toEqual({ success: true, data: { duplicates: [{ _id: 'dup-1' }] } });
    expect(merge).toEqual({ success: true, data: { merged: true } });
  });
});
