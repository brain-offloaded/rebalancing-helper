import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './App';

const AuthFormMock = vi.hoisted(() =>
  vi.fn(() => <div data-testid="auth-form" />),
);

vi.mock('./components/AuthForm', () => ({
  AuthForm: AuthFormMock,
}));

const useAuthMock = vi.hoisted(() => vi.fn());

vi.mock('./auth/use-auth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('./auth/auth-context', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('AppShell', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
    AuthFormMock.mockClear();
  });

  it('초기화 중에는 로딩 메시지를 표시한다', () => {
    useAuthMock.mockReturnValue({
      user: null,
      initializing: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(<AppShell />);

    expect(
      screen.getByText('인증 정보를 확인하고 있습니다...'),
    ).toBeInTheDocument();
    expect(AuthFormMock).not.toHaveBeenCalled();
  });

  it('인증되지 않은 경우 AuthForm을 보여주고 모드를 전환한다', () => {
    const login = vi.fn();
    const register = vi.fn();

    useAuthMock.mockReturnValue({
      user: null,
      initializing: false,
      login,
      register,
      logout: vi.fn(),
    });

    render(<AppShell />);

    expect(AuthFormMock).toHaveBeenCalled();
    const initialProps = AuthFormMock.mock.calls.at(-1)?.[0];
    expect(initialProps?.mode).toBe('login');
    expect(initialProps?.onSubmit).toBe(login);

    act(() => {
      initialProps?.onToggleMode();
    });

    const updatedProps = AuthFormMock.mock.calls.at(-1)?.[0];
    expect(updatedProps?.mode).toBe('register');
    expect(updatedProps?.onSubmit).toBe(register);
  });

  it('인증된 사용자에게 이메일과 로그아웃 버튼을 렌더링한다', async () => {
    const logout = vi.fn();

    useAuthMock.mockReturnValue({
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      initializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    render(<AppShell />);

    expect(screen.getByText('demo@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(logout).toHaveBeenCalled();
  });
});
