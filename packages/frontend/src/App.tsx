import { useMemo, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider } from 'styled-components';
import { apolloClient } from './apollo-client';
import './App.css';
import { AuthProvider } from './auth/auth-context';
import { useAuth } from './auth/use-auth';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { GlobalStyle, theme } from './styles/GlobalStyle';

export const AppShell = () => {
  const { user, initializing, login, register, logout } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = useMemo(
    () => (mode === 'login' ? login : register),
    [mode, login, register],
  );

  if (initializing) {
    return (
      <div
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
      </div>
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
      <header
        style={{
          backgroundColor: '#0f172a',
          color: 'white',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1 style={{ marginBottom: '4px' }}>리밸런싱 헬퍼</h1>
            <p style={{ color: 'rgba(255,255,255,0.75)' }}>
              포트폴리오 리밸런싱을 위한 조회 전용 도구
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{user.email}</div>
            <button
              type="button"
              onClick={() => void logout()}
              style={{
                marginTop: '8px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <Dashboard />
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
