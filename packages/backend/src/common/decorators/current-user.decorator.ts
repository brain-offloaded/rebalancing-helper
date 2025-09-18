import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GraphqlContext } from '../graphql/graphql-context.type';
import { ActiveUserData } from '../../auth/auth.types';

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): ActiveUserData => {
    const gqlContext = GqlExecutionContext.create(context);
    const { user } = gqlContext.getContext<GraphqlContext>();

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user;
  },
);
