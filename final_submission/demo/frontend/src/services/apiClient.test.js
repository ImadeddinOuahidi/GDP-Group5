jest.mock('axios', () => {
  const state = {};
  const requestUse = jest.fn((onFulfilled, onRejected) => {
    state.requestInterceptor = onFulfilled;
    state.requestErrorInterceptor = onRejected;
  });
  const responseUse = jest.fn((onFulfilled, onRejected) => {
    state.responseSuccessInterceptor = onFulfilled;
    state.responseErrorInterceptor = onRejected;
  });
  const client = {
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
    defaults: {
      baseURL: 'http://localhost:5001/api',
    },
  };

  globalThis.__SAFE_MED_AXIOS_TEST_STATE__ = {
    state,
    requestUse,
    responseUse,
    client,
  };

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => client),
    },
  };
});

import { tokenManager, userManager } from './apiClient';

const getAxiosTestState = () => globalThis.__SAFE_MED_AXIOS_TEST_STATE__;

describe('frontend apiClient storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('token manager preserves and clears primary and legacy token keys', () => {
    tokenManager.setToken('token-123');
    localStorage.setItem('authToken', 'legacy-token');

    expect(tokenManager.getToken()).toBe('token-123');

    tokenManager.clearAll();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('user manager stores and parses structured user profiles', () => {
    const user = { id: 'u1', role: 'doctor', name: 'Dr. Ada' };
    userManager.setUser(user);

    expect(userManager.getUser()).toEqual(user);

    userManager.removeUser();
    expect(userManager.getUser()).toBeNull();
  });

  test('user manager returns null when the stored profile is invalid JSON', () => {
    localStorage.setItem('user', '{not-json');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(userManager.getUser()).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  test('request interceptor attaches a bearer token for non-demo sessions', () => {
    const { state } = getAxiosTestState();
    localStorage.setItem('token', 'jwt-token');

    const config = state.requestInterceptor({ headers: {}, method: 'get', url: '/reports' });

    expect(config.headers.Authorization).toBe('Bearer jwt-token');
    expect(config.metadata).toBeDefined();
  });

  test('response interceptor clears stored auth on 401 responses', async () => {
    const { state } = getAxiosTestState();
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ email: 'doctor@example.com' }));

    const error = {
      response: { status: 401, data: { message: 'Unauthorized' } },
      config: {
        metadata: { startTime: new Date() },
        url: '/reports',
      },
    };

    await expect(state.responseErrorInterceptor(error)).rejects.toBe(error);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(dispatchSpy).toHaveBeenCalled();

    dispatchSpy.mockRestore();
    logSpy.mockRestore();
  });
});
