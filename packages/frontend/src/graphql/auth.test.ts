import { describe, it, expect } from 'vitest';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  ME_QUERY,
} from './auth';

const isDocumentNode = (node: unknown): boolean =>
  typeof node === 'object' && node !== null && 'kind' in (node as Record<string, unknown>);

describe('auth GraphQL documents', () => {
  it('각 문서는 GraphQL DocumentNode 형태이다', () => {
    expect(isDocumentNode(LOGIN_MUTATION)).toBe(true);
    expect(isDocumentNode(REGISTER_MUTATION)).toBe(true);
    expect(isDocumentNode(ME_QUERY)).toBe(true);
  });
});
