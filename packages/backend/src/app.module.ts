import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ConfigModule } from '@nestjs/config';
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

type GraphqlContextFactoryArgs = {
  req: Request;
  res: Response;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: false,
      introspection: true,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }: GraphqlContextFactoryArgs): GraphqlContext => {
        const requestIdHeader = req.headers['x-request-id'];
        const requestIdCandidate = Array.isArray(requestIdHeader)
          ? requestIdHeader[0]
          : requestIdHeader;
        const requestId =
          typeof requestIdCandidate === 'string' &&
          requestIdCandidate.length > 0
            ? requestIdCandidate
            : randomUUID();

        return { req, res, requestId, user: null };
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BrokerageModule,
    HoldingsModule,
    TagsModule,
    RebalancingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
