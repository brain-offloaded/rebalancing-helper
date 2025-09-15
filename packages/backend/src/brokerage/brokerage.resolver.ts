import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BrokerageService } from './brokerage.service';
import { BrokerageAccount, BrokerageHolding } from './brokerage.entities';
import { CreateBrokerageAccountInput, UpdateBrokerageAccountInput } from './brokerage.dto';

@Resolver(() => BrokerageAccount)
export class BrokerageResolver {
  constructor(private readonly brokerageService: BrokerageService) {}

  @Query(() => [BrokerageAccount])
  async brokerageAccounts(): Promise<BrokerageAccount[]> {
    return this.brokerageService.getAccounts();
  }

  @Query(() => BrokerageAccount, { nullable: true })
  async brokerageAccount(@Args('id') id: string): Promise<BrokerageAccount | null> {
    return this.brokerageService.getAccount(id);
  }

  @Query(() => [BrokerageHolding])
  async brokerageHoldings(
    @Args('accountId', { nullable: true }) accountId?: string,
  ): Promise<BrokerageHolding[]> {
    return this.brokerageService.getHoldings(accountId);
  }

  @Mutation(() => BrokerageAccount)
  async createBrokerageAccount(
    @Args('input') input: CreateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    return this.brokerageService.createAccount(input);
  }

  @Mutation(() => BrokerageAccount)
  async updateBrokerageAccount(
    @Args('input') input: UpdateBrokerageAccountInput,
  ): Promise<BrokerageAccount> {
    return this.brokerageService.updateAccount(input);
  }

  @Mutation(() => Boolean)
  async deleteBrokerageAccount(@Args('id') id: string): Promise<boolean> {
    return this.brokerageService.deleteAccount(id);
  }

  @Mutation(() => [BrokerageHolding])
  async refreshBrokerageHoldings(@Args('accountId') accountId: string): Promise<BrokerageHolding[]> {
    return this.brokerageService.refreshHoldings(accountId);
  }
}