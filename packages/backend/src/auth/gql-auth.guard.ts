import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { GraphqlContext } from '../common/graphql/graphql-context.type';
import { ActiveUserData } from './auth.types';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  override getRequest(context: ExecutionContext): Request {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    return gqlExecutionContext.getContext<GraphqlContext>().req;
  }

  override handleRequest<TUser extends ActiveUserData = ActiveUserData>(
    err: unknown,
    user: TUser | null,
    info: unknown,
    context: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err || !user) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw err ?? new UnauthorizedException();
    }

    const gqlContext =
      GqlExecutionContext.create(context).getContext<GraphqlContext>();
    gqlContext.user = user;

    return user;
  }
}
