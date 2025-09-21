import type { ExecutionContext } from '@nestjs/common';
import type { GraphqlContext } from '../graphql/graphql-context.type';
import { resolveGqlContext } from './gql-context.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

jest.mock('@nestjs/graphql', () => ({
  GqlExecutionContext: {
    create: jest.fn(),
  },
}));

describe('resolveGqlContext', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GraphQL ExecutionContext에서 GraphqlContext를 추출한다', () => {
    const mockGraphqlContext = {
      req: {} as never,
      res: {} as never,
      requestId: 'req-1',
      user: null,
    } satisfies GraphqlContext;

    (GqlExecutionContext.create as jest.Mock).mockReturnValue({
      getContext: jest.fn().mockReturnValue(mockGraphqlContext),
    });

    const executionContext = {} as ExecutionContext;
    const result = resolveGqlContext(executionContext);

    expect(GqlExecutionContext.create).toHaveBeenCalledWith(executionContext);
    expect(result).toBe(mockGraphqlContext);
  });
});
