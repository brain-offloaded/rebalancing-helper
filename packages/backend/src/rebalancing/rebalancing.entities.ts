import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class RebalancingGroup {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String])
  tagIds: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TagAllocation {
  @Field()
  tagId: string;

  @Field()
  tagName: string;

  @Field()
  tagColor: string;

  @Field(() => Float)
  currentValue: number;

  @Field(() => Float)
  currentPercentage: number;

  @Field(() => Float)
  targetPercentage: number;

  @Field(() => Float)
  difference: number;
}

@ObjectType()
export class RebalancingAnalysis {
  @Field(() => ID)
  groupId: string;

  @Field()
  groupName: string;

  @Field(() => Float)
  totalValue: number;

  @Field(() => [TagAllocation])
  allocations: TagAllocation[];

  @Field()
  lastUpdated: Date;
}

@ObjectType()
export class InvestmentRecommendation {
  @Field()
  tagId: string;

  @Field()
  tagName: string;

  @Field(() => Float)
  recommendedAmount: number;

  @Field(() => Float)
  recommendedPercentage: number;

  @Field(() => [String])
  suggestedSymbols: string[];
}