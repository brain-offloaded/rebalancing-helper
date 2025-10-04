import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum BrokerageAccountSyncMode {
  MANUAL = 'MANUAL',
  API = 'API',
}

registerEnumType(BrokerageAccountSyncMode, {
  name: 'BrokerageAccountSyncMode',
});

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

  @Field(() => BrokerageAccountSyncMode)
  syncMode: BrokerageAccountSyncMode;

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
