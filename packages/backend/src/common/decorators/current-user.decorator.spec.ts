import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { resolveCurrentUser } from './current-user.decorator';
import { ActiveUserData } from '../../auth/auth.types';
import { GraphqlContext } from '../graphql/graphql-context.type';

describe('resolveCurrentUser', () => {
  beforeEach(() => {
    jest.spyOn(GqlExecutionContext, 'create').mockImplementation(
      (context: ExecutionContext) =>
        ({
          getContext: () =>
            ({
              user: (context as unknown as { user: ActiveUserData | null })
                .user,
            }) as GraphqlContext,
        }) as unknown as GqlExecutionContext,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('사용자가 존재하면 해당 사용자를 반환한다', () => {
    const user: ActiveUserData = {
      userId: 'user-1',
      email: 'demo@example.com',
    };
    const context = { user } as unknown as ExecutionContext;

    const result = resolveCurrentUser(context);

    expect(result).toBe(user);
  });

  it('사용자가 없으면 UnauthorizedException을 던진다', () => {
    const context = { user: null } as unknown as ExecutionContext;

    expect(() => resolveCurrentUser(context)).toThrow(UnauthorizedException);
  });
});
