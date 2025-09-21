import { useState } from 'react';

type AuthFormProps = {
  mode: 'login' | 'register';
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
  onToggleMode: () => void;
};

export const AuthForm = ({ mode, onSubmit, onToggleMode }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({ email, password });
    } catch (submissionError) {
      const fallbackMessage =
        submissionError instanceof Error
          ? submissionError.message
          : '요청을 처리하지 못했습니다. 다시 시도해주세요.';
      setError(fallbackMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '80px auto',
        padding: '24px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.1)',
      }}
    >
      <h2 style={{ marginBottom: '12px', fontSize: '24px' }}>
        {isRegister ? '회원가입' : '로그인'}
      </h2>
      <p style={{ marginBottom: '24px', color: '#6b7280', fontSize: '14px' }}>
        {isRegister
          ? '계정을 생성하고 리밸런싱 헬퍼를 사용해보세요.'
          : '등록된 이메일과 비밀번호로 로그인하세요.'}
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>이메일</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          />
        </label>

        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={{ fontSize: '14px', color: '#374151' }}>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            placeholder="8자리 이상 비밀번호"
            style={{
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
            }}
          />
        </label>

        {error ? (
          <div
            style={{
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            backgroundColor: submitting ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            fontSize: '15px',
            transition: 'background-color 0.2s ease',
          }}
        >
          {submitting ? '처리 중...' : isRegister ? '가입하기' : '로그인'}
        </button>
      </form>

      <button
        type="button"
        onClick={onToggleMode}
        style={{
          marginTop: '16px',
          background: 'none',
          border: 'none',
          color: '#2563eb',
          cursor: 'pointer',
          fontSize: '14px',
          textDecoration: 'underline',
        }}
      >
        {isRegister
          ? '이미 계정이 있으신가요? 로그인'
          : '처음이신가요? 회원가입'}
      </button>
    </div>
  );
};
