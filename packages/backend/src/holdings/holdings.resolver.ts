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
  holdingTags(
    @Args('holdingSymbol', { nullable: true }) holdingSymbol?: string,
  ): Promise<HoldingTag[]> {
    const normalizedSymbol = holdingSymbol ?? undefined;

    return this.holdingsService.getHoldingTags(normalizedSymbol);
  }

  @Query(() => [String])
  tagsForHolding(
    @Args('holdingSymbol') holdingSymbol: string,
  ): Promise<string[]> {
    return this.holdingsService.getTagsForHolding(holdingSymbol);
  }

  @Query(() => [String])
  holdingsForTag(@Args('tagId') tagId: string): Promise<string[]> {
    return this.holdingsService.getHoldingsForTag(tagId);
  }

  @Mutation(() => HoldingTag)
  addHoldingTag(@Args('input') input: AddHoldingTagInput): Promise<HoldingTag> {
    return this.holdingsService.addTag(input);
  }

  @Mutation(() => Boolean)
  removeHoldingTag(
    @Args('input') input: RemoveHoldingTagInput,
  ): Promise<boolean> {
    return this.holdingsService.removeTag(input);
  }

  @Mutation(() => [HoldingTag])
  setHoldingTags(
    @Args('input') input: SetHoldingTagsInput,
  ): Promise<HoldingTag[]> {
    return this.holdingsService.setTags(input);
  }
}
