import { type ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ApolloError } from '@apollo/client';
import { AuthProvider } from './auth-context';
import { useAuth } from './use-auth';
import { apolloClient, AUTH_TOKEN_STORAGE_KEY } from '../apollo-client';
import { GraphQLError } from 'graphql';

vi.mock('../apollo-client', async () => {
  const actual =
    await vi.importActual<typeof import('../apollo-client')>(
      '../apollo-client',
    );
  const query = vi.fn();
  const mutate = vi.fn();
  const clearStore = vi.fn();
  return {
    ...actual,
    apolloClient: { query, mutate, clearStore },
  };
});

type MockApolloClient = typeof apolloClient & {
  query: ReturnType<typeof vi.fn>;
  mutate: ReturnType<typeof vi.fn>;
  clearStore: ReturnType<typeof vi.fn>;
};

const mockApollo = apolloClient as unknown as MockApolloClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const flushAsyncEffects = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
};

describe('AuthProvider', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  const consoleWarnSpy = vi
    .spyOn(console, 'warn')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    mockApollo.query.mockReset();
    mockApollo.mutate.mockReset();
    mockApollo.clearStore.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleErrorSpy.mockClear();
    consoleWarnSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('토큰이 없으면 사용자 없이 초기화한다', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(result.current.user).toBeNull();
    expect(mockApollo.query).not.toHaveBeenCalled();
  });

  it('저장된 토큰이 있으면 사용자 정보를 조회한다', async () => {
    const user = {
      id: 'user-1',
      email: 'demo@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockResolvedValue({ data: { me: user } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(result.current.initializing).toBe(false);
    expect(mockApollo.query).toHaveBeenCalledTimes(1);
  });

  it('사용자 정보 조회가 네트워크 오류면 초기화 상태를 유지하고 재시도한다', async () => {
    const user = {
      id: 'user-1',
      email: 'demo@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    vi.useFakeTimers();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query
      .mockRejectedValueOnce(new ApolloError({}))
      .mockResolvedValueOnce({ data: { me: user } });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await flushAsyncEffects();
    expect(mockApollo.query).toHaveBeenCalledTimes(1);
    expect(result.current.initializing).toBe(true);
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('token');

    act(() => {
      vi.advanceTimersByTime(2_999);
    });
    expect(mockApollo.query).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    await flushAsyncEffects();
    expect(mockApollo.query).toHaveBeenCalledTimes(2);
    expect(result.current.user).toEqual(user);
    expect(result.current.initializing).toBe(false);
  });

  it('네트워크 오류 재시도는 지수 백오프 간격을 적용한다', async () => {
    vi.useFakeTimers();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockRejectedValue(new ApolloError({}));

    renderHook(() => useAuth(), { wrapper });

    await flushAsyncEffects();
    expect(mockApollo.query).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    await flushAsyncEffects();
    expect(mockApollo.query).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(5_999);
    });
    expect(mockApollo.query).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    await flushAsyncEffects();
    expect(mockApollo.query).toHaveBeenCalledTimes(3);
  });

  it('사용자 조회 재시도 타이머는 언마운트 시 정리한다', async () => {
    vi.useFakeTimers();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockRejectedValue(new ApolloError({}));

    const { unmount } = renderHook(() => useAuth(), { wrapper });
    await flushAsyncEffects();
    expect(mockApollo.query).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockApollo.query).toHaveBeenCalledTimes(1);
  });

  it('사용자 정보 조회가 unauthorized 메시지면 토큰을 초기화한다', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockRejectedValue(
      new ApolloError({
        graphQLErrors: [new GraphQLError('Unauthorized: expired token')],
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(result.current.user).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('사용자 정보 조회가 인증 오류면 토큰을 초기화한다', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockRejectedValue(
      new ApolloError({
        graphQLErrors: [
          new GraphQLError(
            'Unauthorized',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            { code: 'UNAUTHENTICATED' },
          ),
        ],
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(result.current.user).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('사용자 정보 조회가 401 네트워크 오류면 토큰을 초기화한다', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockRejectedValue(
      new ApolloError({
        networkError: {
          name: 'ServerError',
          message: 'Unauthorized',
          statusCode: 401,
        } as Error & { statusCode: number },
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.initializing).toBe(false));
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(result.current.user).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('login 성공 시 사용자와 토큰을 저장한다', async () => {
    const user = {
      id: 'user-1',
      email: 'demo@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockApollo.mutate.mockResolvedValue({
      data: {
        login: { accessToken: 'token', user },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    await act(async () => {
      await result.current.login({
        email: 'demo@example.com',
        password: 'secret123',
      });
    });

    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(mockApollo.mutate).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('token');
  });

  it('login 실패 시 오류 메시지를 전달한다', async () => {
    mockApollo.mutate.mockRejectedValue(
      new ApolloError({
        graphQLErrors: [new GraphQLError('잘못된 자격 증명')],
      }),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    await expect(
      result.current.login({
        email: 'demo@example.com',
        password: 'wrong',
      }),
    ).rejects.toThrow('잘못된 자격 증명');
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('register 성공 시 사용자와 토큰을 저장한다', async () => {
    const user = {
      id: 'user-2',
      email: 'new@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    mockApollo.mutate.mockResolvedValue({
      data: {
        register: { accessToken: 'register-token', user },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    await act(async () => {
      await result.current.register({
        email: 'new@example.com',
        password: 'secret123',
      });
    });

    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe('register-token');
  });

  it('logout은 토큰을 초기화하고 Apollo 캐시를 비운다', async () => {
    mockApollo.clearStore.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    act(() => {
      result.current.logout();
    });

    await waitFor(() => expect(mockApollo.clearStore).toHaveBeenCalled());
    expect(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('logout 중 오류가 발생해도 예외를 전파하지 않는다', async () => {
    mockApollo.clearStore.mockRejectedValue(new Error('clear failed'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initializing).toBe(false));

    act(() => {
      void result.current.logout();
    });

    await waitFor(() => expect(mockApollo.clearStore).toHaveBeenCalled());
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});
