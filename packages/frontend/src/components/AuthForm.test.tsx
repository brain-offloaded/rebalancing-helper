import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm';

describe('AuthForm', () => {
  it('로그인 모드에서 onSubmit을 호출한다', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onToggleMode = vi.fn();

    render(
      <AuthForm mode="login" onSubmit={onSubmit} onToggleMode={onToggleMode} />,
    );

    await userEvent.type(
      screen.getByPlaceholderText('you@example.com'),
      'user@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('8자리 이상 비밀번호'),
      'password123',
    );
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('제출 중에는 버튼이 비활성화되고 완료 후 복구된다', async () => {
    const onSubmit = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0)),
      );

    render(
      <AuthForm mode="login" onSubmit={onSubmit} onToggleMode={() => {}} />,
    );

    await userEvent.type(
      screen.getByPlaceholderText('you@example.com'),
      'user@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('8자리 이상 비밀번호'),
      'password123',
    );

    const button = screen.getByRole('button', { name: '로그인' });
    const submitPromise = userEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    await submitPromise;
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('에러가 발생하면 메시지를 표시한다', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('로그인 실패'));

    render(
      <AuthForm mode="login" onSubmit={onSubmit} onToggleMode={() => {}} />,
    );

    await userEvent.type(
      screen.getByPlaceholderText('you@example.com'),
      'user@example.com',
    );
    await userEvent.type(
      screen.getByPlaceholderText('8자리 이상 비밀번호'),
      'password123',
    );
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByText('로그인 실패')).toBeInTheDocument();
  });

  it('모드를 전환할 수 있다', async () => {
    const onToggleMode = vi.fn();

    render(
      <AuthForm mode="login" onSubmit={vi.fn()} onToggleMode={onToggleMode} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: '처음이신가요? 회원가입' }),
    );

    expect(onToggleMode).toHaveBeenCalled();
  });

  it('회원가입 모드에서는 UI 텍스트가 달라진다', () => {
    render(
      <AuthForm mode="register" onSubmit={vi.fn()} onToggleMode={() => {}} />,
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      '회원가입',
    );
    expect(
      screen.getByRole('button', { name: '이미 계정이 있으신가요? 로그인' }),
    ).toBeInTheDocument();
  });
});
