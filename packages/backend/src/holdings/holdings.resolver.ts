import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { HoldingsService } from './holdings.service';
import { HoldingTag } from './holdings.entities';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
} from './holdings.dto';

@Resolver(() => HoldingTag)
export class HoldingsResolver {
  constructor(private readonly holdingsService: HoldingsService) {}

  @Query(() => [HoldingTag])
  async holdingTags(
    @Args('holdingSymbol', { nullable: true }) holdingSymbol?: string,
  ): Promise<HoldingTag[]> {
    return this.holdingsService.getHoldingTags(holdingSymbol);
  }

  @Query(() => [String])
  async tagsForHolding(
    @Args('holdingSymbol') holdingSymbol: string,
  ): Promise<string[]> {
    return this.holdingsService.getTagsForHolding(holdingSymbol);
  }

  @Query(() => [String])
  async holdingsForTag(@Args('tagId') tagId: string): Promise<string[]> {
    return this.holdingsService.getHoldingsForTag(tagId);
  }

  @Mutation(() => HoldingTag)
  async addHoldingTag(
    @Args('input') input: AddHoldingTagInput,
  ): Promise<HoldingTag> {
    return this.holdingsService.addTag(input);
  }

  @Mutation(() => Boolean)
  async removeHoldingTag(
    @Args('input') input: RemoveHoldingTagInput,
  ): Promise<boolean> {
    return this.holdingsService.removeTag(input);
  }

  @Mutation(() => [HoldingTag])
  async setHoldingTags(
    @Args('input') input: SetHoldingTagsInput,
  ): Promise<HoldingTag[]> {
    return this.holdingsService.setTags(input);
  }
}
