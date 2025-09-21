import { createContext } from 'react';

export type User = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  user: User | null;
  token: string | null;
  initializing: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
