import { useMemo, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './apollo-client';
import './App.css';
import { AuthProvider, useAuth } from './auth/auth-context';
import { AuthForm } from './components/AuthForm';

const AppShell = () => {
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
        <section
          style={{
            marginBottom: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h2 style={{ marginBottom: '8px' }}>증권사 계정 관리</h2>
          <p style={{ marginBottom: '16px', color: '#475569' }}>
            증권사 API를 연동하고 보유 종목을 최신 상태로 유지하세요.
          </p>
          <button
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            계정 추가
          </button>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h3 style={{ marginBottom: '12px' }}>GraphQL 연결 테스트</h3>
          <p style={{ marginBottom: '8px', color: '#475569' }}>
            인증이 적용되었습니다. GraphQL Playground에서 요청 시 헤더에 토큰을
            추가하세요.
          </p>
          <a
            href="http://localhost:3000/graphql"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline' }}
          >
            http://localhost:3000/graphql
          </a>
        </section>
      </main>
    </div>
  );
};

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
