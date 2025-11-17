import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import type { DecimalInput } from '@rebalancing-helper/common';
import { DecimalScalar } from '../common/scalars/decimal.scalar';

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

  @Field(() => DecimalScalar)
  quantity: DecimalInput;

  @Field(() => DecimalScalar)
  currentPrice: DecimalInput;

  @Field(() => DecimalScalar)
  marketValue: DecimalInput;

  @Field(() => String)
  currency: string;

  @Field(() => Date)
  lastTradedAt: Date;

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

  @Field(() => DecimalScalar)
  quantity: DecimalInput;

  @Field(() => DecimalScalar)
  currentPrice: DecimalInput;

  @Field(() => DecimalScalar)
  marketValue: DecimalInput;

  @Field(() => String)
  currency: string;

  @Field(() => String)
  accountId: string;

  @Field(() => Date)
  lastTradedAt: Date;

  @Field(() => [String])
  tags: string[];
}
