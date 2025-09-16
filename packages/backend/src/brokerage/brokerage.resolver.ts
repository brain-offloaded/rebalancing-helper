import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BrokerageService } from './brokerage.service';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';
import {
  CreateBrokerageAccountInput,
  UpdateBrokerageAccountInput,
} from './brokerage.dto';

@Resolver(() => BrokerageAccount)
export class BrokerageResolver {
  constructor(private readonly brokerageService: BrokerageService) {}

  @Query(() => [BrokerageAccount])
  brokerageAccounts(): Promise<BrokerageAccount[]> {
    return this.brokerageService.getAccounts();
  }

  @Query(() => BrokerageAccount, { nullable: true })
  brokerageAccount(@Args('id') id: string): Promise<BrokerageAccount | null> {
    return this.brokerageService.getAccount(id);
  }

  @Query(() => [BrokerageHolding])
  brokerageHoldings(
    @Args('accountId', { nullable: true }) accountId?: string | null,
  ): Promise<BrokerageHolding[]> {
    return this.brokerageService.getHoldings(accountId);
  }

  @Mutation(() => BrokerageAccount)
  createBrokerageAccount(
    @Args('input') input: CreateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    return this.brokerageService.createAccount(input);
  }

  @Mutation(() => BrokerageAccount)
  updateBrokerageAccount(
    @Args('input') input: UpdateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    return this.brokerageService.updateAccount(input);
  }

  @Mutation(() => Boolean)
  deleteBrokerageAccount(@Args('id') id: string): Promise<boolean> {
    return this.brokerageService.deleteAccount(id);
  }

  @Mutation(() => [BrokerageHolding])
  refreshBrokerageHoldings(
    @Args('accountId') accountId: string,
  ): Promise<BrokerageHolding[]> {
    return this.brokerageService.refreshHoldings(accountId);
  }
}
