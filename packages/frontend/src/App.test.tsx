import { ReactNode } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App, { AppShell } from './App';

const ApolloProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="apollo-provider">{children}</div>
  )),
);

vi.mock('@apollo/client', async () => {
  const actual =
    await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return {
    ...actual,
    ApolloProvider: ApolloProviderMock,
  };
});

const AuthFormMock = vi.hoisted(() =>
  vi.fn(() => <div data-testid="auth-form" />),
);

vi.mock('./components/AuthForm', () => ({
  AuthForm: AuthFormMock,
}));

const DashboardMock = vi.hoisted(() =>
  vi.fn(() => <div data-testid="dashboard" />),
);

vi.mock('./components/Dashboard', () => ({
  Dashboard: DashboardMock,
}));

const RebalancingGroupDetailPageMock = vi.hoisted(() =>
  vi.fn(({ onClose }: { onClose: () => void }) => (
    <div>
      <div data-testid="rebalancing-group-detail" />
      <button type="button" onClick={onClose}>
        닫기
      </button>
    </div>
  )),
);

vi.mock('./components/RebalancingGroupDetailPage', () => ({
  RebalancingGroupDetailPage: RebalancingGroupDetailPageMock,
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
    DashboardMock.mockClear();
    RebalancingGroupDetailPageMock.mockClear();
    ApolloProviderMock.mockClear();
    window.history.replaceState({}, '', '/');
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
      initialProps?.onSubmit?.({
        email: 'demo@example.com',
        password: 'secret',
      });
    });
    expect(login).toHaveBeenCalledWith({
      email: 'demo@example.com',
      password: 'secret',
    });

    act(() => {
      initialProps?.onToggleMode();
    });

    const updatedProps = AuthFormMock.mock.calls.at(-1)?.[0];
    expect(updatedProps?.mode).toBe('register');
    expect(updatedProps?.onSubmit).toBe(register);

    act(() => {
      updatedProps?.onSubmit?.({
        email: 'new@example.com',
        password: 'super-secret',
      });
    });
    expect(register).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'super-secret',
    });
  });

  it('인증된 사용자에게 이메일과 로그아웃 버튼, 대시보드를 렌더링한다', async () => {
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
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(DashboardMock).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(logout).toHaveBeenCalled();
  });

  it('URL에 리밸런싱 그룹 파라미터가 있으면 상세 페이지를 보여주고 닫기 시 대시보드로 돌아간다', async () => {
    window.history.replaceState(
      {},
      '',
      '/?rebalancingGroupId=rebalancing-group-1',
    );
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');
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

    expect(RebalancingGroupDetailPageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'rebalancing-group-1',
      }),
      expect.anything(),
    );
    expect(screen.getByTestId('rebalancing-group-detail')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '닫기' }));

    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/');
    expect(DashboardMock).toHaveBeenCalled();

    replaceStateSpy.mockRestore();
  });

  it('브라우저 뒤로 가기(popstate) 이벤트에 따라 리밸런싱 그룹 상세 페이지를 갱신한다', () => {
    window.history.replaceState(
      {},
      '',
      '/?rebalancingGroupId=rebalancing-group-1',
    );

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
      logout: vi.fn(),
    });

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<AppShell />);

    RebalancingGroupDetailPageMock.mockClear();

    act(() => {
      window.history.replaceState(
        {},
        '',
        '/?rebalancingGroupId=rebalancing-group-2',
      );
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    const latestCall = RebalancingGroupDetailPageMock.mock.calls.at(-1);
    expect(latestCall?.[0].groupId).toBe('rebalancing-group-2');

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'popstate',
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });

  it('App 컴포넌트는 ApolloProvider를 통해 AppShell을 감싼다', () => {
    const logout = vi.fn();

    useAuthMock.mockReturnValue({
      user: {
        id: 'user-42',
        email: 'user42@example.com',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      initializing: false,
      login: vi.fn(),
      register: vi.fn(),
      logout,
    });

    render(<App />);

    expect(ApolloProviderMock).toHaveBeenCalled();
    expect(screen.getByText('user42@example.com')).toBeInTheDocument();
    expect(DashboardMock).toHaveBeenCalled();
  });
});
