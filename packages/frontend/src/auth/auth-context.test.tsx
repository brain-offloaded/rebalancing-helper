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

describe('AuthProvider', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);
  const consoleWarnSpy = vi
    .spyOn(console, 'warn')
    .mockImplementation(() => undefined);

  beforeEach(() => {
    localStorage.clear();
    mockApollo.query.mockReset();
    mockApollo.mutate.mockReset();
    mockApollo.clearStore.mockReset();
  });

  afterEach(() => {
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

  it('사용자 정보 조회가 실패하면 토큰을 초기화한다', async () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    mockApollo.query.mockRejectedValue(new Error('network error'));

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
