import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import styled from 'styled-components';
import { ThemeProvider } from 'styled-components';
import { apolloClient } from './apollo-client';
import './App.css';
import { AuthProvider } from './auth/auth-context';
import { useAuth } from './auth/use-auth';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { RebalancingGroupDetailPage } from './components/RebalancingGroupDetailPage';
import { Button } from './components/ui/Button';
import {
  HeaderBar,
  HeaderContent,
  HeaderSubtitle,
  HeaderTitle,
  PageContainer,
} from './components/ui/Layout';
import { GlobalStyle, theme } from './styles/GlobalStyle';

const UserSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme?.spacing?.xs ?? '8px'};
`;

export const AppShell = () => {
  const { user, initializing, login, register, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [selectedRebalancingGroupId, setSelectedRebalancingGroupId] = useState<
    string | null
  >(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    return params.get('rebalancingGroupId');
  });

  const handleSubmit = useMemo(
    () => (mode === 'login' ? login : register),
    [mode, login, register],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedRebalancingGroupId(params.get('rebalancingGroupId'));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleCloseRebalancingGroup = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('rebalancingGroupId');
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
    setSelectedRebalancingGroupId(null);
  }, []);

  if (initializing) {
    return (
      <PageContainer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '18px',
          color: '#1f2937',
        }}
      >
        인증 정보를 확인하고 있습니다...
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <AuthForm
        mode={mode}
        onSubmit={handleSubmit}
        onToggleMode={() =>
          setMode((previous) => (previous === 'login' ? 'register' : 'login'))
        }
      />
    );
  }

  return (
    <div className="App">
      <HeaderBar>
        <HeaderContent>
          <div>
            <HeaderTitle>리밸런싱 헬퍼</HeaderTitle>
            <HeaderSubtitle>
              포트폴리오 리밸런싱을 위한 조회 전용 도구
            </HeaderSubtitle>
          </div>
          <UserSection>
            <div style={{ fontWeight: 600 }}>{user.email}</div>
            <Button variant="ghost" onClick={() => void logout()}>
              로그아웃
            </Button>
          </UserSection>
        </HeaderContent>
      </HeaderBar>
      <main>
        <PageContainer style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {selectedRebalancingGroupId ? (
            <RebalancingGroupDetailPage
              groupId={selectedRebalancingGroupId}
              onClose={handleCloseRebalancingGroup}
            />
          ) : (
            <Dashboard />
          )}
        </PageContainer>
      </main>
    </div>
  );
};

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <AppShell />
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
