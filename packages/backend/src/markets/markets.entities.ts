import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Market {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  displayName: string;

  @Field(() => String, { nullable: true })
  yahooSuffix: string | null;

  @Field(() => [String])
  yahooMarketIdentifiers: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
