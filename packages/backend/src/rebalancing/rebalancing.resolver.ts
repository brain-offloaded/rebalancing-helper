import { UseGuards } from '@nestjs/common';
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
  AddTagsToRebalancingGroupInput,
  RemoveTagsFromRebalancingGroupInput,
  RenameRebalancingGroupInput,
} from './rebalancing.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';

@UseGuards(GqlAuthGuard)
@Resolver(() => RebalancingGroup)
export class RebalancingResolver {
  constructor(private readonly rebalancingService: RebalancingService) {}

  @Query(() => [RebalancingGroup])
  rebalancingGroups(
    @CurrentUser() user: ActiveUserData,
  ): Promise<RebalancingGroup[]> {
    return this.rebalancingService.getGroups(user.userId);
  }

  @Query(() => RebalancingGroup, { nullable: true })
  rebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<RebalancingGroup | null> {
    return this.rebalancingService.getGroup(user.userId, id);
  }

  @Query(() => RebalancingAnalysis)
  rebalancingAnalysis(
    @CurrentUser() user: ActiveUserData,
    @Args('groupId') groupId: string,
  ): Promise<RebalancingAnalysis> {
    return this.rebalancingService.getRebalancingAnalysis(user.userId, groupId);
  }

  @Mutation(() => RebalancingGroup)
  createRebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: CreateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.createGroup(user.userId, input);
  }

  @Mutation(() => RebalancingGroup)
  updateRebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: UpdateRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.updateGroup(user.userId, input);
  }

  @Mutation(() => Boolean)
  deleteRebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.rebalancingService.deleteGroup(user.userId, id);
  }

  @Mutation(() => Boolean)
  setTargetAllocations(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: SetTargetAllocationsInput,
  ): Promise<boolean> {
    return this.rebalancingService.setTargetAllocations(user.userId, input);
  }

  @Mutation(() => RebalancingGroup)
  addTagsToRebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: AddTagsToRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.addTagsToGroup(user.userId, input);
  }

  @Mutation(() => RebalancingGroup)
  removeTagsFromRebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: RemoveTagsFromRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.removeTagsFromGroup(user.userId, input);
  }

  @Mutation(() => RebalancingGroup)
  renameRebalancingGroup(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: RenameRebalancingGroupInput,
  ): Promise<RebalancingGroup> {
    return this.rebalancingService.renameGroup(user.userId, input);
  }

  @Query(() => [InvestmentRecommendation])
  investmentRecommendation(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: CalculateInvestmentInput,
  ): Promise<InvestmentRecommendation[]> {
    return this.rebalancingService.calculateInvestmentRecommendation(
      user.userId,
      input,
    );
  }
}
