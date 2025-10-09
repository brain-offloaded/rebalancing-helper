import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyAuthHeader,
  getStoredAuthToken,
  AUTH_TOKEN_STORAGE_KEY,
} from './apollo-client';

describe('apollo-client helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getStoredAuthToken은 로컬 스토리지의 토큰을 반환한다', () => {
    expect(getStoredAuthToken()).toBeNull();
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, 'token');
    expect(getStoredAuthToken()).toBe('token');
  });

  it('서버 사이드 환경에서는 토큰을 읽지 않는다', () => {
    const originalWindow = window;
    // @ts-expect-error 테스트를 위한 window 제거
    delete (globalThis as { window?: Window }).window;

    expect(getStoredAuthToken()).toBeNull();

    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  });

  it('applyAuthHeader는 기존 헤더를 유지하고 토큰을 추가한다', () => {
    const headers = applyAuthHeader(
      { 'Content-Type': 'application/json' },
      'token',
    );
    expect(headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    });
  });

  it('applyAuthHeader는 토큰이 없으면 Authorization을 추가하지 않는다', () => {
    const headers = applyAuthHeader({ Accept: 'application/json' }, null);
    expect(headers).toEqual({ Accept: 'application/json' });
  });

  it('applyAuthHeader는 헤더가 없으면 새 객체를 생성한다', () => {
    const headers = applyAuthHeader(undefined, 'token');
    expect(headers).toEqual({ Authorization: 'Bearer token' });
  });
});
