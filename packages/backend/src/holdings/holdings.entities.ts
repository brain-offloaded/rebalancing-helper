import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class HoldingTag {
  @Field(() => ID)
  id: string;

  @Field()
  holdingSymbol: string;

  @Field()
  tagId: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class EnrichedHolding {
  @Field(() => ID)
  id: string;

  @Field()
  symbol: string;

  @Field()
  name: string;

  @Field(() => Number)
  quantity: number;

  @Field(() => Number)
  currentPrice: number;

  @Field(() => Number)
  marketValue: number;

  @Field(() => Number, { nullable: true })
  averageCost?: number;

  @Field()
  currency: string;

  @Field()
  accountId: string;

  @Field()
  lastUpdated: Date;

  @Field(() => [String])
  tags: string[];
}
