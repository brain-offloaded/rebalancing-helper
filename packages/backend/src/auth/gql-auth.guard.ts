import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { GraphqlContext } from '../common/graphql/graphql-context.type';
import { ActiveUserData } from './auth.types';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  override getRequest(context: ExecutionContext) {
    const gqlExecutionContext = GqlExecutionContext.create(context);
    return gqlExecutionContext.getContext<GraphqlContext>().req;
  }

  override handleRequest(
    err: unknown,
    user: ActiveUserData | null,
    info: unknown,
    context: ExecutionContext,
  ) {
    if (err || !user) {
      throw err ?? new UnauthorizedException();
    }

    const gqlContext = GqlExecutionContext.create(context).getContext<GraphqlContext>();
    gqlContext.user = user;

    return user;
  }
}
