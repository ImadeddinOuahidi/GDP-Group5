jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('../config/constants', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      UPLOADS: '/uploads',
    },
  },
}));

jest.mock('./apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import apiClient from './apiClient';
import { uploadService } from './uploadService';

describe('mobile uploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploads multiple files and strips ios file:// prefixes', async () => {
    const entries = [];
    const originalFormData = global.FormData;

    global.FormData = class {
      append(name, value) {
        entries.push([name, value]);
      }
    };

    apiClient.post.mockResolvedValue({
      data: { success: true, data: { uploaded: true } },
    });

    await uploadService.uploadFiles([
      { uri: 'file:///tmp/photo.jpg', mimeType: 'image/jpeg', fileName: 'photo.jpg' },
    ]);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/multiple',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
    );
    expect(entries[0][1]).toMatchObject({
      uri: '/tmp/photo.jpg',
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    global.FormData = originalFormData;
  });

  test('uploads a single file with the configured endpoint and timeout', async () => {
    const originalFormData = global.FormData;

    global.FormData = class {
      append() {}
    };

    apiClient.post.mockResolvedValue({
      data: { success: true, data: { uploaded: true } },
    });

    await uploadService.uploadSingle({
      uri: 'file:///tmp/scan.png',
      mimeType: 'image/png',
      fileName: 'scan.png',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/single',
      expect.any(FormData),
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      })
    );

    global.FormData = originalFormData;
  });

  test('reports upload availability as unavailable when the API fails', async () => {
    apiClient.get.mockRejectedValue(new Error('offline'));

    const result = await uploadService.checkStatus();

    expect(result).toEqual({ data: { available: false } });
  });
});
