import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { resolveGqlContext } from './gql-context.decorator';
import { GraphqlContext } from '../graphql/graphql-context.type';

describe('resolveGqlContext', () => {
  const baseContext: GraphqlContext = {
    user: {
      userId: 'user-1',
      email: 'demo@example.com',
    },
  } as GraphqlContext;

  beforeEach(() => {
    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockImplementation(
        () =>
          ({ getContext: () => baseContext }) as unknown as GqlExecutionContext,
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GraphQL 컨텍스트를 반환한다', () => {
    const context = {} as ExecutionContext;

    const result = resolveGqlContext(context);

    expect(result).toBe(baseContext);
  });
});
