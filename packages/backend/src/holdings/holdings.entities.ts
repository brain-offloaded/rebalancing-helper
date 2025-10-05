import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum HoldingSource {
  BROKERAGE = 'BROKERAGE',
  MANUAL = 'MANUAL',
}

registerEnumType(HoldingSource, {
  name: 'HoldingSource',
});

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
export class Holding {
  @Field(() => ID)
  id: string;

  @Field(() => HoldingSource)
  source: HoldingSource;

  @Field(() => String)
  accountId: string;

  @Field(() => String, { nullable: true })
  market: string | null;

  @Field(() => String)
  symbol: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  alias: string | null;

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

  @Field(() => String)
  currency: string;

  @Field(() => String)
  accountId: string;

  @Field(() => Date)
  lastUpdated: Date;

  @Field(() => [String])
  tags: string[];
}
