jest.mock('../config/constants', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      LOGIN: '/auth/signin',
      REGISTER: '/auth/signup',
      PROFILE: '/auth/profile',
      CHANGE_PASSWORD: '/auth/change-password',
    },
  },
}));

jest.mock('./apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import apiClient from './apiClient';
import { authService } from './authService';

describe('mobile authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs in via the configured auth endpoint', async () => {
    apiClient.post.mockResolvedValue({
      data: { success: true, data: { token: 'abc', user: { _id: '1', role: 'patient' } } },
    });

    const result = await authService.login('patient@example.com', 'Password123!');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/signin', {
      email: 'patient@example.com',
      password: 'Password123!',
    });
    expect(result).toEqual({
      success: true,
      data: { token: 'abc', user: { _id: '1', role: 'patient' } },
    });
  });

  test('loads the user profile and updates it through the profile endpoints', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { success: true, data: { user: { _id: 'user-1', role: 'doctor' } } },
    });
    apiClient.put.mockResolvedValueOnce({
      data: { success: true, data: { user: { _id: 'user-1', role: 'doctor', lastName: 'Lovelace' } } },
    });

    await authService.getProfile();
    await authService.updateProfile({ lastName: 'Lovelace' });

    expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
    expect(apiClient.put).toHaveBeenCalledWith('/auth/profile', { lastName: 'Lovelace' });
  });

  test('changes password through the dedicated endpoint', async () => {
    apiClient.put.mockResolvedValue({
      data: { success: true, message: 'Password changed' },
    });

    const result = await authService.changePassword({
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    });

    expect(apiClient.put).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'OldPass123!',
      newPassword: 'NewPass123!',
    });
    expect(result.success).toBe(true);
  });
});
