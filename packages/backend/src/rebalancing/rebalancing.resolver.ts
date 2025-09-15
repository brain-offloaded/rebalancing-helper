import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { RebalancingService } from './rebalancing.service';
import { RebalancingGroup, RebalancingAnalysis, InvestmentRecommendation } from './rebalancing.entities';
import { CreateRebalancingGroupInput, UpdateRebalancingGroupInput, SetTargetAllocationsInput, CalculateInvestmentInput } from './rebalancing.dto';

@Resolver(() => RebalancingGroup)
export class RebalancingResolver {
  constructor(private readonly rebalancingService: RebalancingService) {}

  @Query(() => [RebalancingGroup])
  async rebalancingGroups(): Promise<RebalancingGroup[]> {
    return this.rebalancingService.getGroups();
  }

  @Query(() => RebalancingGroup, { nullable: true })
  async rebalancingGroup(@Args('id') id: string): Promise<RebalancingGroup | null> {
    return this.rebalancingService.getGroup(id);
  }

  @Query(() => RebalancingAnalysis)
  async rebalancingAnalysis(@Args('groupId') groupId: string): Promise<RebalancingAnalysis> {
    return this.rebalancingService.getRebalancingAnalysis(groupId);
  }

  @Mutation(() => RebalancingGroup)
  async createRebalancingGroup(
    @Args('input') input: CreateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.createGroup(input);
  }

  @Mutation(() => RebalancingGroup)
  async updateRebalancingGroup(
    @Args('input') input: UpdateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.updateGroup(input);
  }

  @Mutation(() => Boolean)
  async deleteRebalancingGroup(@Args('id') id: string): Promise<boolean> {
    return this.rebalancingService.deleteGroup(id);
  }

  @Mutation(() => Boolean)
  async setTargetAllocations(@Args('input') input: SetTargetAllocationsInput): Promise<boolean> {
    return this.rebalancingService.setTargetAllocations(input);
  }

  @Query(() => [InvestmentRecommendation])
  async investmentRecommendation(
    @Args('input') input: CalculateInvestmentInput,
  ): Promise<InvestmentRecommendation[]> {
    return this.rebalancingService.calculateInvestmentRecommendation(input);
  }
}