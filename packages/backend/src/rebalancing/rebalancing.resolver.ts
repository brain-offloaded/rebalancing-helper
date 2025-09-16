import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { RebalancingService } from './rebalancing.service';
import {
  RebalancingGroup,
  RebalancingAnalysis,
  InvestmentRecommendation,
} from './rebalancing.entities';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
} from './rebalancing.dto';

@Resolver(() => RebalancingGroup)
export class RebalancingResolver {
  constructor(private readonly rebalancingService: RebalancingService) {}

  @Query(() => [RebalancingGroup])
  rebalancingGroups(): Promise<RebalancingGroup[]> {
    return this.rebalancingService.getGroups();
  }

  @Query(() => RebalancingGroup, { nullable: true })
  rebalancingGroup(@Args('id') id: string): Promise<RebalancingGroup | null> {
    return this.rebalancingService.getGroup(id);
  }

  @Query(() => RebalancingAnalysis)
  rebalancingAnalysis(
    @Args('groupId') groupId: string,
  ): Promise<RebalancingAnalysis> {
    return this.rebalancingService.getRebalancingAnalysis(groupId);
  }

  @Mutation(() => RebalancingGroup)
  createRebalancingGroup(
    @Args('input') input: CreateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.createGroup(input);
  }

  @Mutation(() => RebalancingGroup)
  updateRebalancingGroup(
    @Args('input') input: UpdateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.updateGroup(input);
  }

  @Mutation(() => Boolean)
  deleteRebalancingGroup(@Args('id') id: string): Promise<boolean> {
    return this.rebalancingService.deleteGroup(id);
  }

  @Mutation(() => Boolean)
  setTargetAllocations(
    @Args('input') input: SetTargetAllocationsInput,
  ): Promise<boolean> {
    return this.rebalancingService.setTargetAllocations(input);
  }

  @Query(() => [InvestmentRecommendation])
  investmentRecommendation(
    @Args('input') input: CalculateInvestmentInput,
  ): Promise<InvestmentRecommendation[]> {
    return this.rebalancingService.calculateInvestmentRecommendation(input);
  }
}
