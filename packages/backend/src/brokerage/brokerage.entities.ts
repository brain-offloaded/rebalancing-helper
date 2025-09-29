import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Broker {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  apiBaseUrl: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class BrokerageAccount {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  brokerId: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Broker)
  broker: Broker;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
