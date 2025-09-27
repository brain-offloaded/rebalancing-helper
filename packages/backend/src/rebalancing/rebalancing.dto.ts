import { InputType, Field, Float } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

@InputType()
export class CreateRebalancingGroupInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}

@InputType()
export class UpdateRebalancingGroupInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}

@InputType()
export class TagTargetInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  tagId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  @Max(100)
  targetPercentage: number;
}

@InputType()
export class SetTargetAllocationsInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @Field(() => [TagTargetInput])
  @IsArray()
  targets: TagTargetInput[];
}

@InputType()
export class AddTagsToRebalancingGroupInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}

@InputType()
export class RemoveTagsFromRebalancingGroupInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}

@InputType()
export class RenameRebalancingGroupInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;
}

@InputType()
export class CalculateInvestmentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  investmentAmount: number;
}
