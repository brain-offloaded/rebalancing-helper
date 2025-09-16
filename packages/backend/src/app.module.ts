import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrokerageModule } from './brokerage/brokerage.module';
import { HoldingsModule } from './holdings/holdings.module';
import { TagsModule } from './tags/tags.module';
import { RebalancingModule } from './rebalancing/rebalancing.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    PrismaModule,
    BrokerageModule,
    HoldingsModule,
    TagsModule,
    RebalancingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
