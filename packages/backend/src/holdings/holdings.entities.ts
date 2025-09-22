import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class HoldingTag {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  holdingSymbol: string;

  @Field(() => String)
  tagId: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class ManualHolding {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  market: string;

  @Field(() => String)
  symbol: string;

  @Field(() => String)
  name: string;

  @Field(() => Number)
  quantity: number;

  @Field(() => Number)
  currentPrice: number;

  @Field(() => Number)
  marketValue: number;

  @Field(() => String)
  currency: string;

  @Field(() => Date)
  lastUpdated: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class EnrichedHolding {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  symbol: string;

  @Field(() => String)
  name: string;

  @Field(() => Number)
  quantity: number;

  @Field(() => Number)
  currentPrice: number;

  @Field(() => Number)
  marketValue: number;

  @Field(() => Number, { nullable: true })
  averageCost: number | null;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  accountId: string;

  @Field(() => Date)
  lastUpdated: Date;

  @Field(() => [String])
  tags: string[];
}
