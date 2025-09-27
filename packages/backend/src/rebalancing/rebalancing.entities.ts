import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class RebalancingGroup {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => [String])
  tagIds: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class TagAllocation {
  @Field(() => String)
  tagId: string;

  @Field(() => String)
  tagName: string;

  @Field(() => String)
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

  @Field(() => String)
  groupName: string;

  @Field(() => Float)
  totalValue: number;

  @Field(() => String)
  baseCurrency: string;

  @Field(() => [TagAllocation])
  allocations: TagAllocation[];

  @Field(() => Date)
  lastUpdated: Date;
}

@ObjectType()
export class InvestmentRecommendation {
  @Field(() => String)
  tagId: string;

  @Field(() => String)
  tagName: string;

  @Field(() => Float)
  recommendedAmount: number;

  @Field(() => String)
  baseCurrency: string;

  @Field(() => Float)
  recommendedPercentage: number;

  @Field(() => [String])
  suggestedSymbols: string[];
}
