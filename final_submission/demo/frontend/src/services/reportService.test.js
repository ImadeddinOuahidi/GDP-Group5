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
import reportService from './reportService';

describe('frontend reportService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('returns demo reports without calling the API when demo mode is active', async () => {
    localStorage.setItem('token', 'demo-token-patient');

    const result = await reportService.getAllReports({ page: 1 });

    expect(result.status).toBe('success');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBe('pending');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  test('submits a report to the reports endpoint', async () => {
    apiClient.post.mockResolvedValue({
      data: { success: true, data: { _id: 'report-1' } },
    });

    const payload = { medicine: 'ibuprofen', sideEffects: ['nausea'] };
    const result = await reportService.submitReport(payload);

    expect(apiClient.post).toHaveBeenCalledWith('/reports', payload);
    expect(result).toEqual({ success: true, data: { _id: 'report-1' } });
  });

  test('creates AI submission form data for text, images, audio, and autoSubmit', () => {
    const originalFormData = global.FormData;
    const appendMock = jest.fn();
    global.FormData = class {
      constructor() {
        this.append = appendMock;
      }
    };

    const formData = reportService.createAIReportFormData({
      text: 'Severe nausea after medication',
      images: [{ name: 'photo.png' }],
      audio: { name: 'voice.m4a' },
      autoSubmit: true,
    });

    expect(formData).toBeInstanceOf(global.FormData);
    expect(appendMock).toHaveBeenCalledWith('text', 'Severe nausea after medication');
    expect(appendMock).toHaveBeenCalledWith('images', { name: 'photo.png' }, 'photo.png');
    expect(appendMock).toHaveBeenCalledWith('audio', { name: 'voice.m4a' }, 'voice.m4a');
    expect(appendMock).toHaveBeenCalledWith('autoSubmit', true);

    global.FormData = originalFormData;
  });

  test('falls back gracefully when duplicate checking fails', async () => {
    apiClient.post.mockRejectedValue(new Error('network down'));

    const result = await reportService.checkDuplicates({ medicine: 'ibuprofen' });

    expect(result.success).toBe(false);
    expect(result.data.hasDuplicates).toBe(false);
    expect(result.data.duplicates).toEqual([]);
  });

  test('routes status and dashboard calls to the correct endpoints', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { success: true, data: [] } })
      .mockResolvedValueOnce({ data: { success: true, data: { total: 3 } } });
    apiClient.put.mockResolvedValue({ data: { success: true } });

    await reportService.updateReportStatus('report-1', { status: 'Reviewed' });
    await reportService.getDashboardStats();

    expect(apiClient.put).toHaveBeenCalledWith('/reports/report-1/status', { status: 'Reviewed' });
    expect(apiClient.get).toHaveBeenCalledWith('/reports/dashboard');
  });
});
