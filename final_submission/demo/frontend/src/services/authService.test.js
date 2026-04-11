jest.mock('./apiClient', () => {
  const api = {
    auth: {
      signup: jest.fn(),
      signin: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerification: jest.fn(),
      deactivateAccount: jest.fn(),
    },
  };

  return {
    __esModule: true,
    api,
    tokenManager: {
      setToken: jest.fn((token) => localStorage.setItem('token', token)),
      clearAll: jest.fn(() => localStorage.clear()),
      getToken: jest.fn(() => localStorage.getItem('token')),
    },
    userManager: {
      setUser: jest.fn((user) => localStorage.setItem('user', JSON.stringify(user))),
      removeUser: jest.fn(() => localStorage.removeItem('user')),
      getUser: jest.fn(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
      }),
    },
    default: {},
  };
});

import authService from './authService';
import { api, tokenManager, userManager } from './apiClient';

describe('frontend authService', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('signs in and stores the authenticated doctor user and token', async () => {
    api.auth.signin.mockResolvedValue({
      data: {
        success: true,
        message: 'Login successful',
        data: {
          user: { _id: 'doctor-1', email: 'doctor@example.com', role: 'doctor' },
          token: 'jwt-token',
        },
      },
    });

    const result = await authService.signin({
      email: 'doctor@example.com',
      password: 'Password123!',
    });

    expect(result).toEqual({
      success: true,
      user: { _id: 'doctor-1', email: 'doctor@example.com', role: 'doctor' },
      token: 'jwt-token',
      message: 'Login successful',
    });
    expect(tokenManager.setToken).toHaveBeenCalledWith('jwt-token');
    expect(userManager.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'doctor@example.com', role: 'doctor' })
    );
  });

  test('stores the authenticated user and token after signup', async () => {
    api.auth.signup.mockResolvedValue({
      data: {
        success: true,
        message: 'Registration successful',
        data: {
          user: { _id: 'user-1', email: 'patient@example.com', role: 'patient' },
          token: 'jwt-token',
        },
      },
    });

    const result = await authService.signup({ email: 'patient@example.com' });

    expect(result.success).toBe(true);
    expect(tokenManager.setToken).toHaveBeenCalledWith('jwt-token');
    expect(userManager.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'patient@example.com', role: 'patient' })
    );
    tokenManager.getToken.mockReturnValue('jwt-token');
    userManager.getUser.mockReturnValue({ _id: 'user-1', email: 'patient@example.com', role: 'patient' });
    expect(authService.isAuthenticated()).toBe(true);
  });

  test('loads profile data and refreshes stored user data', async () => {
    api.auth.getProfile.mockResolvedValue({
      data: {
        success: true,
        data: {
          user: {
            _id: 'user-2',
            firstName: 'Grace',
            lastName: 'Hopper',
            role: 'doctor',
          },
        },
      },
    });

    const result = await authService.getProfile();

    expect(result.success).toBe(true);
    expect(userManager.setUser).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Grace', lastName: 'Hopper', role: 'doctor' })
    );
  });

  test('initializes auth state and role helpers from stored user data', () => {
    tokenManager.getToken.mockReturnValue('real-token');
    userManager.getUser.mockReturnValue({
      _id: 'user-3',
      email: 'patient@example.com',
      role: 'patient',
    });

    expect(authService.initializeAuth()).toEqual({
      success: true,
      user: {
        _id: 'user-3',
        email: 'patient@example.com',
        role: 'patient',
      },
      token: 'real-token',
      isAuthenticated: true,
    });
    expect(authService.isPatient()).toBe(true);
    expect(authService.isDoctor()).toBe(false);
    expect(authService.isAdmin()).toBe(false);
  });

  test('logout clears stored credentials and emits logout events', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    tokenManager.getToken.mockReturnValue('real-token');
    userManager.getUser.mockReturnValue({ email: 'patient@example.com' });

    const result = authService.logout();

    expect(result.success).toBe(true);
    expect(tokenManager.clearAll).toHaveBeenCalled();
    expect(userManager.removeUser).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });
});
