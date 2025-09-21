import { UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { resolveCurrentUser } from './current-user.decorator';
import { ActiveUserData } from '../../auth/auth.types';

jest.mock('@nestjs/graphql');

describe('CurrentUser decorator', () => {
  const createExecutionContext = () => ({}) as never;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('컨텍스트에서 user를 반환한다', () => {
    const user: ActiveUserData = {
      userId: 'user-1',
      email: 'demo@example.com',
    };
    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ user }),
    });

    const result = resolveCurrentUser(createExecutionContext());

    expect(result).toBe(user);
  });

  it('user가 없으면 UnauthorizedException을 던진다', () => {
    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: () => ({ user: null }),
    });

    expect(() => resolveCurrentUser(createExecutionContext())).toThrow(
      UnauthorizedException,
    );
  });
});
