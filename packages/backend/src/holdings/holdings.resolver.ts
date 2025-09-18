import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HoldingsService } from './holdings.service';
import { HoldingTag } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
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
}
