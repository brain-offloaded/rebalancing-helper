import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import { Module } from '@nestjs/common';
import { join } from 'node:path';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrokerageModule } from './brokerage/brokerage.module';
import { HoldingsModule } from './holdings/holdings.module';
import { TagsModule } from './tags/tags.module';
import { RebalancingModule } from './rebalancing/rebalancing.module';
import { PrismaModule } from './prisma/prisma.module';
import { GraphqlContext } from './common/graphql/graphql-context.type';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypedConfigModule } from './typed-config';
import { MarketsModule } from './markets/markets.module';

export type GraphqlContextFactoryArgs = {
  req: Request;
  res: Response;
};

export const REQUEST_ID_HEADER = 'x-request-id';

export function createGraphqlContext({
  req,
  res,
}: GraphqlContextFactoryArgs): GraphqlContext {
  const requestIdHeader = req.headers[REQUEST_ID_HEADER];
  const requestIdCandidate = Array.isArray(requestIdHeader)
    ? requestIdHeader[0]
    : requestIdHeader;
  const requestId =
    typeof requestIdCandidate === 'string' && requestIdCandidate.length > 0
      ? requestIdCandidate
      : randomUUID();

  return { req, res, requestId, user: null };
}

@Module({
  imports: [
    TypedConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Emit SDL file so that we can run schema generation offline (frontend codegen etc.)
      autoSchemaFile: join(process.cwd(), 'generated.graphql'),
      sortSchema: true,
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: createGraphqlContext,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BrokerageModule,
    HoldingsModule,
    TagsModule,
    RebalancingModule,
    MarketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
