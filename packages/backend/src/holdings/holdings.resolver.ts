import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HoldingsService } from './holdings.service';
import { HoldingTag, ManualHolding } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
} from './holdings.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';

@UseGuards(GqlAuthGuard)
@Resolver(() => HoldingTag)
export class HoldingsResolver {
  constructor(private readonly holdingsService: HoldingsService) {}

  @Query(() => [HoldingTag])
  holdingTags(
    @CurrentUser() user: ActiveUserData,
    @Args('holdingSymbol', { nullable: true }) holdingSymbol?: string,
  ): Promise<HoldingTag[]> {
    const normalizedSymbol = holdingSymbol ?? undefined;

    return this.holdingsService.getHoldingTags(user.userId, normalizedSymbol);
  }

  @Query(() => [String])
  tagsForHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('holdingSymbol') holdingSymbol: string,
  ): Promise<string[]> {
    return this.holdingsService.getTagsForHolding(user.userId, holdingSymbol);
  }

  @Query(() => [String])
  holdingsForTag(
    @CurrentUser() user: ActiveUserData,
    @Args('tagId') tagId: string,
  ): Promise<string[]> {
    return this.holdingsService.getHoldingsForTag(user.userId, tagId);
  }

  @Mutation(() => HoldingTag)
  addHoldingTag(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: AddHoldingTagInput,
  ): Promise<HoldingTag> {
    return this.holdingsService.addTag(user.userId, input);
  }

  @Mutation(() => Boolean)
  removeHoldingTag(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: RemoveHoldingTagInput,
  ): Promise<boolean> {
    return this.holdingsService.removeTag(user.userId, input);
  }

  @Mutation(() => [HoldingTag])
  setHoldingTags(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: SetHoldingTagsInput,
  ): Promise<HoldingTag[]> {
    return this.holdingsService.setTags(user.userId, input);
  }

  @Query(() => [ManualHolding])
  manualHoldings(@CurrentUser() user: ActiveUserData): Promise<ManualHolding[]> {
    return this.holdingsService.getManualHoldings(user.userId);
  }

  @Mutation(() => ManualHolding)
  createManualHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: CreateManualHoldingInput,
  ): Promise<ManualHolding> {
    return this.holdingsService.createManualHolding(user.userId, input);
  }

  @Mutation(() => ManualHolding)
  increaseManualHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: IncreaseManualHoldingInput,
  ): Promise<ManualHolding> {
    return this.holdingsService.increaseManualHolding(user.userId, input);
  }

  @Mutation(() => ManualHolding)
  setManualHoldingQuantity(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: SetManualHoldingQuantityInput,
  ): Promise<ManualHolding> {
    return this.holdingsService.setManualHoldingQuantity(user.userId, input);
  }

  @Mutation(() => Boolean)
  deleteManualHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: ManualHoldingIdentifierInput,
  ): Promise<boolean> {
    return this.holdingsService.deleteManualHolding(user.userId, input);
  }

  @Mutation(() => ManualHolding)
  syncManualHoldingPrice(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: ManualHoldingIdentifierInput,
  ): Promise<ManualHolding> {
    return this.holdingsService.syncManualHoldingPrice(user.userId, input);
  }
}
