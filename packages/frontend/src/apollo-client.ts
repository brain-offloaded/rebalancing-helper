import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
});

export const AUTH_TOKEN_STORAGE_KEY = 'rebalancing-helper.authToken';

export const getStoredAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const applyAuthHeader = (
  headers: Record<string, string> | undefined,
  token: string | null,
): Record<string, string> => ({
  ...(headers ?? {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const authLink = setContext((_, { headers }) => {
  const token = getStoredAuthToken();

  return {
    headers: applyAuthHeader(headers, token),
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
