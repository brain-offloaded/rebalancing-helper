import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BrokerageService } from './brokerage.service';
import {
  Broker,
  BrokerageAccount,
  BrokerageHolding,
} from './brokerage.entities';
import {
  CreateBrokerInput,
  CreateBrokerageAccountInput,
  PatchHoldingQuantityInput,
  PutHoldingQuantityInput,
  SyncHoldingPriceInput,
  UpdateBrokerInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';

@UseGuards(GqlAuthGuard)
@Resolver(() => BrokerageAccount)
export class BrokerageResolver {
  constructor(private readonly brokerageService: BrokerageService) {}

  @Query(() => [Broker])
  brokers(@CurrentUser() _user: ActiveUserData): Promise<Broker[]> {
    return this.brokerageService.listBrokers();
  }

  @Mutation(() => Broker)
  createBroker(
    @CurrentUser() _user: ActiveUserData,
    @Args('input') input: CreateBrokerInput,
  ): Promise<Broker> {
    return this.brokerageService.createBroker(input);
  }

  @Mutation(() => Broker)
  updateBroker(
    @CurrentUser() _user: ActiveUserData,
    @Args('input') input: UpdateBrokerInput,
  ): Promise<Broker> {
    return this.brokerageService.updateBroker(input);
  }

  @Mutation(() => Boolean)
  deleteBroker(
    @CurrentUser() _user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.brokerageService.deleteBroker(id);
  }

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

  @Mutation(() => BrokerageHolding)
  patchBrokerageHoldingQuantity(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: PatchHoldingQuantityInput,
  ): Promise<BrokerageHolding> {
    return this.brokerageService.patchHoldingQuantity(user.userId, input);
  }

  @Mutation(() => BrokerageHolding)
  putBrokerageHoldingQuantity(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: PutHoldingQuantityInput,
  ): Promise<BrokerageHolding> {
    return this.brokerageService.putHoldingQuantity(user.userId, input);
  }

  @Mutation(() => BrokerageHolding)
  syncBrokerageHoldingPrice(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: SyncHoldingPriceInput,
  ): Promise<BrokerageHolding> {
    return this.brokerageService.syncHoldingPrice(user.userId, input);
  }
}
