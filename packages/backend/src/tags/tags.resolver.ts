import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TagsService } from './tags.service';
import { Tag } from './tags.entities';
import { CreateTagInput, UpdateTagInput } from './tags.dto';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveUserData } from '../auth/auth.types';

@UseGuards(GqlAuthGuard)
@Resolver(() => Tag)
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Query(() => [Tag])
  tags(@CurrentUser() user: ActiveUserData): Promise<Tag[]> {
    return this.tagsService.getTags(user.userId);
  }

  @Query(() => Tag, { nullable: true })
  tag(
    @CurrentUser() user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<Tag | null> {
    return this.tagsService.getTag(user.userId, id);
  }

  @Mutation(() => Tag)
  createTag(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: CreateTagInput,
  ): Promise<Tag> {
    return this.tagsService.createTag(user.userId, input);
  }

  @Mutation(() => Tag)
  updateTag(
    @CurrentUser() user: ActiveUserData,
    @Args('input') input: UpdateTagInput,
  ): Promise<Tag> {
    return this.tagsService.updateTag(user.userId, input);
  }

  @Mutation(() => Boolean)
  deleteTag(
    @CurrentUser() user: ActiveUserData,
    @Args('id') id: string,
  ): Promise<boolean> {
    return this.tagsService.deleteTag(user.userId, id);
  }
}
