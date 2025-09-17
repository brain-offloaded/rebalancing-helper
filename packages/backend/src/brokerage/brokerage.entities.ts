import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BrokerageAccount {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  brokerName: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class BrokerageHolding {
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
}
