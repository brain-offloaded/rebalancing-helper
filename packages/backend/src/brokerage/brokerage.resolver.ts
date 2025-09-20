import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BrokerageService } from './brokerage.service';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';

@UseGuards(GqlAuthGuard)
@Resolver(() => BrokerageAccount)
export class BrokerageResolver {
  constructor(private readonly brokerageService: BrokerageService) {}

  @Query(() => [BrokerageAccount])
  brokerageAccounts(
    @CurrentUser() user: ActiveUserData,
  ): Promise<BrokerageAccount[]> {
    return this.brokerageService.getAccounts(user.userId);
  }

  @Query(() => BrokerageAccount, { nullable: true })
  brokerageAccount(
    @CurrentUser() user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<BrokerageAccount | null> {
    return this.brokerageService.getAccount(user.userId, id);
  }

  @Query(() => [BrokerageHolding])
  brokerageHoldings(
    @CurrentUser() user: ActiveUserData,
    @Args('accountId', { nullable: true }) accountId?: string,
  ): Promise<BrokerageHolding[]> {
    const normalizedAccountId = accountId ?? undefined;

    return this.brokerageService.getHoldings(user.userId, normalizedAccountId);
  }

  @Mutation(() => BrokerageAccount)
  createBrokerageAccount(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: CreateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    return this.brokerageService.createAccount(user.userId, input);
  }

  @Mutation(() => BrokerageAccount)
  updateBrokerageAccount(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: UpdateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    return this.brokerageService.updateAccount(user.userId, input);
  }

  @Mutation(() => Boolean)
  deleteBrokerageAccount(
    @CurrentUser() user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.brokerageService.deleteAccount(user.userId, id);
  }

  @Mutation(() => [BrokerageHolding])
  refreshBrokerageHoldings(
    @CurrentUser() user: ActiveUserData,
    @Args('accountId') accountId: string,
  ): Promise<BrokerageHolding[]> {
    return this.brokerageService.refreshHoldings(user.userId, accountId);
  }
}
