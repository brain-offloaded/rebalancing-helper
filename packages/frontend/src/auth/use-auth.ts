import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context.shared';

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth 훅은 AuthProvider 내부에서만 사용할 수 있습니다.');
  }

  return context;
};
