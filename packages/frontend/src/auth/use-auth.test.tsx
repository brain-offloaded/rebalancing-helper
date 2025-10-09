import { afterAll, describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from './use-auth';

describe('useAuth', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined);

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('AuthProvider 외부에서 사용하면 오류를 발생시킨다', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth 훅은 AuthProvider 내부에서만 사용할 수 있습니다.',
    );
  });
});
