import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApolloError } from '@apollo/client';
import { apolloClient, AUTH_TOKEN_STORAGE_KEY } from '../apollo-client';
import { LOGIN_MUTATION, ME_QUERY, REGISTER_MUTATION } from '../graphql/auth';
import {
  AuthContext,
  type AuthContextValue,
  type AuthCredentials,
  type User,
} from './auth-context.shared';

const readStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

const persistToken = (token: string | null): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApolloError) {
    const graphMessage = error.graphQLErrors.at(0)?.message;
    if (graphMessage) {
      return graphMessage;
    }
    if (error.networkError?.message) {
      return error.networkError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(() =>
    readStoredToken(),
  );
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  const setToken = useCallback((value: string | null) => {
    persistToken(value);
    setTokenState(value);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUser = async (): Promise<void> => {
      if (!token) {
        setUser(null);
        setInitializing(false);
        return;
      }

      if (user) {
        setInitializing(false);
        return;
      }

      setInitializing(true);

      try {
        const { data } = await apolloClient.query<{ me: User }>({
          query: ME_QUERY,
          fetchPolicy: 'network-only',
        });

        if (!cancelled) {
          setUser(data.me);
        }
      } catch (error) {
        console.error('Failed to fetch current user', error);
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    void fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [token, setToken, user]);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      try {
        const { data } = await apolloClient.mutate<{
          login: { accessToken: string; user: User };
        }>({
          mutation: LOGIN_MUTATION,
          variables: { input: credentials },
        });

        if (!data?.login) {
          throw new Error('로그인에 실패했습니다. 다시 시도해주세요.');
        }

        setUser(data.login.user);
        setToken(data.login.accessToken);
      } catch (error) {
        setToken(null);
        setUser(null);
        throw new Error(getErrorMessage(error));
      }
    },
    [setToken],
  );

  const register = useCallback(
    async (credentials: AuthCredentials) => {
      try {
        const { data } = await apolloClient.mutate<{
          register: { accessToken: string; user: User };
        }>({
          mutation: REGISTER_MUTATION,
          variables: { input: credentials },
        });

        if (!data?.register) {
          throw new Error('회원가입에 실패했습니다. 다시 시도해주세요.');
        }

        setUser(data.register.user);
        setToken(data.register.accessToken);
      } catch (error) {
        setToken(null);
        setUser(null);
        throw new Error(getErrorMessage(error));
      }
    },
    [setToken],
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    try {
      await apolloClient.clearStore();
    } catch (error) {
      console.warn('Failed to clear Apollo cache on logout', error);
    }
  }, [setToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      initializing,
      login,
      register,
      logout,
    }),
    [user, token, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
