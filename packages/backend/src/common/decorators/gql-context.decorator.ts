import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphqlContext } from '../graphql/graphql-context.type';

export const resolveGqlContext = (
  context: ExecutionContext,
): GraphqlContext => {
  const gqlContext = GqlExecutionContext.create(context);

  return gqlContext.getContext<GraphqlContext>();
};

export const GqlContext = createParamDecorator(
  (_: unknown, context: ExecutionContext): GraphqlContext =>
    resolveGqlContext(context),
);
