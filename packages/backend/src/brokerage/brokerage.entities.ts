import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class BrokerageAccount {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  brokerName: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class BrokerageHolding {
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
}
