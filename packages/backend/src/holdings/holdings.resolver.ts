import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HoldingsService } from './holdings.service';
import { HoldingTag, Holding, HoldingSource } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
  CreateManualHoldingInput,
  IncreaseManualHoldingInput,
  SetManualHoldingQuantityInput,
  ManualHoldingIdentifierInput,
  SetHoldingAliasInput,
} from './holdings.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';
import { HoldingSource as PrismaHoldingSource } from '@prisma/client';

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

  @Query(() => [Holding])
  holdings(
    @CurrentUser() user: ActiveUserData,
    @Args('source', { type: () => HoldingSource, nullable: true })
    source?: HoldingSource,
    @Args('accountId', { nullable: true }) accountId?: string,
  ): Promise<Holding[]> {
    const normalizedAccountId = accountId ?? undefined;
    const normalizedSource = source
      ? (source as unknown as PrismaHoldingSource)
      : undefined;

    return this.holdingsService.getHoldings(user.userId, {
      source: normalizedSource,
      accountId: normalizedAccountId,
    });
  }

  @Mutation(() => Holding)
  createManualHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: CreateManualHoldingInput,
  ): Promise<Holding> {
    return this.holdingsService.createManualHolding(user.userId, input);
  }

  @Mutation(() => Holding)
  increaseManualHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: IncreaseManualHoldingInput,
  ): Promise<Holding> {
    return this.holdingsService.increaseManualHolding(user.userId, input);
  }

  @Mutation(() => Holding)
  setManualHoldingQuantity(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: SetManualHoldingQuantityInput,
  ): Promise<Holding> {
    return this.holdingsService.setManualHoldingQuantity(user.userId, input);
  }

  @Mutation(() => Boolean)
  deleteManualHolding(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: ManualHoldingIdentifierInput,
  ): Promise<boolean> {
    return this.holdingsService.deleteManualHolding(user.userId, input);
  }

  @Mutation(() => Holding)
  syncManualHoldingPrice(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: ManualHoldingIdentifierInput,
  ): Promise<Holding> {
    return this.holdingsService.syncManualHoldingPrice(user.userId, input);
  }

  @Mutation(() => Holding)
  setHoldingAlias(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: SetHoldingAliasInput,
  ): Promise<Holding> {
    return this.holdingsService.setHoldingAlias(user.userId, input);
  }
}
