import { Query, Resolver } from '@nestjs/graphql';
import { Market } from './markets.entities';
import { MarketsService } from './markets.service';

@Resolver(() => Market)
export class MarketsResolver {
  constructor(private readonly marketsService: MarketsService) {}

  @Query(() => [Market])
  markets(): Promise<Market[]> {
    return this.marketsService.list();
  }
}
