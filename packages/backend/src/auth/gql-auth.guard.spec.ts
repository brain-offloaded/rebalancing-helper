import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlAuthGuard } from './gql-auth.guard';
import type { GraphqlContext } from '../common/graphql/graphql-context.type';
import { ActiveUserData } from './auth.types';

jest.mock('@nestjs/graphql');

const createExecutionContext = () => ({}) as ExecutionContext;

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard;
  let gqlContext: GraphqlContext;

  beforeEach(() => {
    guard = new GqlAuthGuard();
    gqlContext = {
      req: { headers: {} } as unknown as GraphqlContext['req'],
      res: {} as GraphqlContext['res'],
      requestId: 'req-1',
      user: null,
    };

    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => gqlContext,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('getRequest는 GraphQL 컨텍스트의 req를 반환한다', () => {
    const request = guard.getRequest(createExecutionContext());

    expect(request).toBe(gqlContext.req);
  });

  it('handleRequest는 사용자 정보를 설정하고 반환한다', () => {
    const user: ActiveUserData = {
      userId: 'user-1',
      email: 'demo@example.com',
    };

    const result = guard.handleRequest(
      null,
      user,
      null,
      createExecutionContext(),
    );

    expect(result).toBe(user);
    expect(gqlContext.user).toBe(user);
  });

  it('handleRequest는 사용자 정보가 없으면 UnauthorizedException을 던진다', () => {
    expect(() =>
      guard.handleRequest(null, null, null, createExecutionContext()),
    ).toThrow(UnauthorizedException);
  });
});
