import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TagsService } from './tags.service';
import { Tag } from './tags.entities';
import { CreateTagInput, UpdateTagInput } from './tags.dto';

@Resolver(() => Tag)
export class TagsResolver {
  constructor(private readonly tagsService: TagsService) {}

  @Query(() => [Tag])
  tags(): Promise<Tag[]> {
    return this.tagsService.getTags();
  }

  @Query(() => Tag, { nullable: true })
  tag(@Args('id') id: string): Promise<Tag | null> {
    return this.tagsService.getTag(id);
  }

  @Mutation(() => Tag)
  createTag(@Args('input') input: CreateTagInput): Promise<Tag> {
    return this.tagsService.createTag(input);
  }

  @Mutation(() => Tag)
  updateTag(@Args('input') input: UpdateTagInput): Promise<Tag> {
    return this.tagsService.updateTag(input);
  }

  @Mutation(() => Boolean)
  deleteTag(@Args('id') id: string): Promise<boolean> {
    return this.tagsService.deleteTag(id);
  }
}
